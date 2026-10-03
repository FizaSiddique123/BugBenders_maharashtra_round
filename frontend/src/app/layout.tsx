import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import "./globals.css";

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
    <ClerkProvider
      appearance={{
        elements: {
          card: 'bg-[#0F0F0F] border border-[#242424] shadow-2xl rounded-xl',
          headerTitle: 'text-2xl font-bold tracking-tight text-white',
          headerSubtitle: 'text-sm text-[#888888]',
          formFieldLabel: 'text-[11px] uppercase tracking-wider text-[#666666] font-semibold mb-1',
          formFieldInput: 'bg-[#151515] border-[#242424] text-white focus:border-white focus:ring-0 transition-colors rounded py-2',
          formButtonPrimary: 'bg-white text-black font-bold hover:bg-gray-200 text-xs tracking-wide py-3 uppercase transition-colors',
          socialButtonsBlockButton: 'bg-[#151515] border-[#242424] hover:bg-[#1A1A1A] text-white transition-colors',
          socialButtonsBlockButtonText: 'font-medium',
          dividerText: 'text-[#666666] text-xs',
          dividerLine: 'bg-[#242424]',
          footerActionLink: 'text-white hover:text-gray-300 font-semibold',
          identityPreview: 'bg-[#151515] border-[#242424]',
          alert: 'bg-[#1A1A1A] border border-[#333333] text-white',
        }
      }}
    >
      <html lang="en" className="dark bg-[#050505] text-[#F5F5F5] scroll-smooth">
        <body className="min-h-screen bg-[#050505] bg-noise text-[#F5F5F5] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}