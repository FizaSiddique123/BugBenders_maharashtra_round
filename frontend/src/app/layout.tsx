import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ClerkDPDPAOverlay } from '@/components/auth/ClerkDPDPAOverlay'
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
        baseTheme: dark,
        variables: {
          colorBackground: 'transparent',
          colorPrimary: '#F5F5F5',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
        },
        elements: {
          card: 'bg-[rgba(50,50,50,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.2)] shadow-[0_24px_70px_rgba(0,0,0,0.7)] rounded-[20px] !max-h-[calc(100dvh-24px)] !w-full !max-w-[440px] flex flex-col',
          headerTitle: '!text-[#FFFFFF] font-bold tracking-tight !text-[20px]',
          headerSubtitle: '!text-[#D4D4D4] text-[12px] mt-0',
          formFieldLabel: '!text-[#FFFFFF] font-semibold text-[11px] uppercase tracking-[0.04em] mb-1',
          formFieldInput: '!bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.3)] !text-white placeholder:!text-[#BBBBBB] focus:!border-white/50 focus:!ring-2 focus:!ring-white/20 transition-all rounded-[10px] h-[42px] px-3 text-[13px]',
          formButtonPrimary: '!bg-[#FFFFFF] !text-[#000000] font-bold hover:!bg-[#E5E5E5] h-[42px] rounded-[10px] transition-colors',
          socialButtonsBlockButton: '!bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.25)] hover:!bg-[rgba(255,255,255,0.25)] transition-colors rounded-[10px] h-[42px]',
          socialButtonsBlockButtonText: 'font-semibold !text-[#FFFFFF] text-[13px]',
          socialButtonsProviderIcon: '!opacity-100',
          dividerText: 'text-[11px] uppercase tracking-widest !text-[#D4D4D4]',
          dividerLine: 'bg-[rgba(255,255,255,0.25)]',
          footerActionLink: '!text-[#FFFFFF] font-bold hover:!text-[#E5E5E5] transition-colors',
          footerActionText: '!text-[#D4D4D4]',
          identityPreview: '!bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.25)] rounded-[10px]',
          alert: 'bg-[rgba(0,0,0,0.5)] border border-white/20 !text-white rounded-xl',
          modalBackdrop: 'bg-[rgba(0,0,0,0.4)] backdrop-blur-[12px] flex items-center justify-center overflow-hidden',
          modalCloseButton: '!text-[#FFFFFF] hover:!bg-white/20 transition-colors rounded-lg w-8 h-8 flex items-center justify-center',
          userButtonPopoverCard: 'bg-[rgba(50,50,50,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.2)] shadow-[0_24px_70px_rgba(0,0,0,0.7)] rounded-[20px]',
          userPreviewSecondaryIdentifier: '!text-[#D4D4D4]',
          userButtonPopoverActionButton: 'hover:!bg-[rgba(255,255,255,0.15)] !text-[#FFFFFF]',
          userButtonPopoverActionButtonText: '!text-[#FFFFFF]',
          userButtonPopoverActionButtonIcon: '!text-[#FFFFFF]',
          userButtonPopoverFooter: 'hidden',
          footer: '!bg-transparent !border-none !text-[#D4D4D4]'
        }
      }}
    >
      <html lang="en" className="dark bg-[#050505] text-[#F5F5F5] scroll-smooth">
        <body className="min-h-screen bg-[#050505] bg-noise text-[#F5F5F5] antialiased">
          <ClerkDPDPAOverlay />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}