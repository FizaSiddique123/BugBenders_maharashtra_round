import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden text-[#F5F5F5] font-sans">
      {/* Background Graphic */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none z-0">
        <span className="text-[25vw] font-black text-white opacity-[0.015] tracking-tighter leading-none whitespace-nowrap">
          CREATE
        </span>
      </div>

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-10 flex items-center gap-3">
         <span className="font-bold text-xl tracking-tight text-white">CreatorAI</span>
         <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-[#333] text-[#888]">Workspace</span>
      </div>

      <div className="z-10 w-full max-w-md p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full bg-[#0A0A0A]/90 border border-white/5 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md pb-6",
              headerTitle: "text-2xl font-bold tracking-tight text-white",
              headerSubtitle: "text-sm text-[#888888] font-medium",
              formFieldLabel: "text-[11px] uppercase tracking-wider text-[#666666] font-semibold mb-2",
              formFieldInput: "bg-[#111111] border border-[#222222] text-white focus:border-white focus:ring-0 transition-colors rounded-lg py-2.5",
              formButtonPrimary: "bg-white text-black font-bold hover:bg-gray-200 text-[11px] tracking-widest py-3 rounded-lg uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:scale-[1.01]",
              socialButtonsBlockButton: "bg-[#111111] border border-[#222222] hover:bg-[#1A1A1A] hover:border-[#333] text-white transition-colors py-2.5 rounded-lg",
              socialButtonsBlockButtonText: "font-semibold text-sm",
              dividerText: "text-[#666666] text-[10px] uppercase tracking-widest font-bold",
              dividerLine: "bg-[#222222]",
              footerActionLink: "text-white hover:text-gray-300 font-bold transition-colors",
              identityPreview: "bg-[#111111] border border-[#222222]",
              identityPreviewText: "text-white",
              identityPreviewEditButtonIcon: "text-[#888888] hover:text-white transition-colors",
              alert: "bg-[#1A1A1A] border border-[#333333] text-white",
              footerActionText: "text-[#888888]",
              logoImage: "hidden", 
              logoBox: "hidden", 
              headerRoot: "pb-2 pt-6"
            }
          }}
        />
      </div>

      <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#444444]">
          Creator Operating System
        </span>
      </div>
    </div>
  );
}
