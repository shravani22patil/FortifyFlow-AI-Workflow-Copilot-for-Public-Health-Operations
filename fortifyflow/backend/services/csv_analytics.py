import json
import pandas as pd
import numpy as np
from scipy import stats
from typing import Tuple
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
from config import get_settings

settings = get_settings()


class CSVAnalyticsService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0.2,
            openai_api_key=settings.openai_api_key
        )

    def auto_detect_columns(self, df: pd.DataFrame) -> dict:
        roles = {}
        for col in df.columns:
            lower = col.lower()
            if any(k in lower for k in ["date", "week", "month", "period", "time", "year"]):
                roles["date_col"] = col
            elif any(k in lower for k in ["region", "district", "state", "zone", "location", "area", "city"]):
                roles["region_col"] = col
            elif any(k in lower for k in ["status", "compliance", "result", "outcome", "grade"]):
                roles["status_col"] = col
            elif df[col].dtype in [np.float64, np.int64]:
                roles.setdefault("metric_cols", []).append(col)
        return roles

    def detect_anomalies(self, df: pd.DataFrame, metric_col: str, group_col: str = None) -> pd.DataFrame:
        df = df.copy()
        numeric = pd.to_numeric(df[metric_col], errors="coerce")
        df[metric_col] = numeric

        if group_col and group_col in df.columns:
            df["z_score"] = df.groupby(group_col)[metric_col].transform(
                lambda x: np.abs(stats.zscore(x.dropna(), nan_policy="omit"))
            )
        else:
            clean = df[metric_col].dropna()
            z = np.abs(stats.zscore(clean))
            df.loc[clean.index, "z_score"] = z

        df["z_score"] = df["z_score"].fillna(0)
        df["is_anomaly"] = df["z_score"] > 2.5
        df["severity"] = pd.cut(
            df["z_score"],
            bins=[0, 2.5, 3.5, np.inf],
            labels=["normal", "warning", "critical"]
        ).astype(str)
        return df

    def generate_statistics(self, df: pd.DataFrame, cols: dict) -> dict:
        summary = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "numeric_summary": {}
        }
        for col in cols.get("metric_cols", []):
            if col in df.columns:
                summary["numeric_summary"][col] = {
                    "mean": round(float(df[col].mean()), 2),
                    "std": round(float(df[col].std()), 2),
                    "min": round(float(df[col].min()), 2),
                    "max": round(float(df[col].max()), 2),
                    "null_count": int(df[col].isna().sum())
                }
        region_col = cols.get("region_col")
        metric_cols = cols.get("metric_cols", [])
        if region_col and region_col in df.columns and metric_cols:
            summary["by_region"] = (
                df.groupby(region_col)[metric_cols[0]]
                .mean()
                .round(2)
                .to_dict()
            )
        return summary

    def generate_ai_insights(self, stats_summary: dict, anomalies_df: pd.DataFrame) -> list:
        if "is_anomaly" in anomalies_df.columns:
            top_anomalies = (
                anomalies_df[anomalies_df["is_anomaly"]]
                .head(10)
                .to_dict("records")
            )
        else:
            top_anomalies = []

        # Sanitize for JSON
        for item in top_anomalies:
            for k, v in item.items():
                if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                    item[k] = None

        prompt = f"""You are a data analyst for a public health food fortification program.

Statistical summary of monitoring data:
{json.dumps(stats_summary, indent=2)}

Top anomalies detected (z-score > 2.5):
{json.dumps(top_anomalies, indent=2)}

Generate 3-4 specific, actionable insights. For each insight respond ONLY with JSON:
[
  {{
    "title": "Short title (max 10 words)",
    "severity": "critical|warning|info",
    "body": "2-3 sentence explanation of what the data shows and why it matters",
    "action": "One specific recommended action"
  }}
]

Respond with ONLY valid JSON array, no other text."""

        response = self.llm([HumanMessage(content=prompt)])
        try:
            # Strip markdown code fences if present
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content)
        except Exception:
            return [{
                "title": "Analysis complete",
                "severity": "info",
                "body": "CSV processed successfully. Review the anomaly table for flagged data points.",
                "action": "Review flagged rows and verify data accuracy with field teams."
            }]

    def process_csv(self, file_path: str) -> dict:
        df = pd.read_csv(file_path)

        # Clean
        df = df.dropna(how="all").dropna(axis=1, how="all")
        df.columns = df.columns.str.strip()

        cols = self.auto_detect_columns(df)
        stats_summary = self.generate_statistics(df, cols)

        anomalies_df = pd.DataFrame()
        metric_cols = cols.get("metric_cols", [])
        if metric_cols:
            anomalies_df = self.detect_anomalies(df, metric_cols[0], cols.get("region_col"))

        insights = self.generate_ai_insights(stats_summary, anomalies_df)

        anomalies_list = []
        if not anomalies_df.empty and "is_anomaly" in anomalies_df.columns:
            raw = anomalies_df[anomalies_df["is_anomaly"]].head(20).to_dict("records")
            for item in raw:
                clean = {}
                for k, v in item.items():
                    if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                        clean[k] = None
                    else:
                        clean[k] = v
                anomalies_list.append(clean)

        return {
            "row_count": len(df),
            "columns_detected": cols,
            "statistics": stats_summary,
            "anomalies": anomalies_list,
            "insights": insights,
            "preview": df.head(5).fillna("").to_dict("records")
        }
