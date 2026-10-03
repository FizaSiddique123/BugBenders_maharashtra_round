import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "CreatorAI — AI-Powered Creator Operating System",
  description: "End-to-end AI workspace for video understanding, auto short-form generation, editable video editing, and multi-platform distribution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#090c10] text-[#f0f6fc]">
      <body className="min-h-screen bg-[#090c10] text-[#f0f6fc] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
