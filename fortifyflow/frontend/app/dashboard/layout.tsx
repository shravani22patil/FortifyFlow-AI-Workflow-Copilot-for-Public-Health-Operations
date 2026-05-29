"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "⊞" },
  { href: "/dashboard/documents", label: "Document Intelligence", icon: "📄", badge: null },
  { href: "/dashboard/monitoring", label: "Monitoring Analytics", icon: "📊" },
  { href: "/dashboard/manuals", label: "Manual Generator", icon: "📋" },
  { href: "/dashboard/reporting", label: "Reporting Assistant", icon: "📝" },
  { href: "/dashboard/search", label: "Semantic Search", icon: "🔍" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f5f3" }}>
      {/* Sidebar */}
      <div style={{
        width: 220, flexShrink: 0, background: "white",
        borderRight: "0.5px solid rgba(0,0,0,0.10)",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "18px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: "#1D9E75",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "white", fontWeight: 500
            }}>F</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18" }}>FortifyFlow</div>
              <div style={{ fontSize: 11, color: "#9a9892" }}>AI Workflow Copilot</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: "#9a9892", textTransform: "uppercase", letterSpacing: "0.07em", padding: "0 8px", marginBottom: 4 }}>Workspace</div>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 8, marginBottom: 1,
                fontSize: 13, textDecoration: "none",
                background: active ? "#E1F5EE" : "transparent",
                color: active ? "#0F6E56" : "#5f5e5a",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s"
              }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: "0.5px solid rgba(0,0,0,0.10)", fontSize: 11, color: "#9a9892" }}>
          Fortify Health · Internal Tool<br />
          <span style={{ color: "#1D9E75" }}>● AI services online</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
