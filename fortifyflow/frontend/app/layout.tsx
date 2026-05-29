import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortifyFlow — AI Workflow Copilot",
  description: "AI-powered document processing, monitoring analytics, and reporting for public health operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
