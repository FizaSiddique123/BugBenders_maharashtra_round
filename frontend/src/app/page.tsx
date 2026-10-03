import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  Film,
  Sparkles,
  Video,
  FileText,
  Share2,
  ChevronRight,
  Play,
  LayoutDashboard,
  BrainCircuit,
  Wand2,
  ListVideo,
  CheckCircle2
} from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

export default async function LandingPage() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans selection:bg-white/20">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <LayoutDashboard className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">CreatorAI</span>
                <span className="hidden sm:block text-[9px] font-bold tracking-widest uppercase text-[#888]">Operating System</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#888]">
              <Link href="#product" className="hover:text-white transition">Product</Link>
              <Link href="#studio" className="hover:text-white transition">AI Studio</Link>
              <Link href="#features" className="hover:text-white transition">Features</Link>
              <Link href="#workflow" className="hover:text-white transition">How it Works</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Open Workspace
              </Link>
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="text-xs font-semibold text-[#AAA] hover:text-white transition hidden sm:block">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    Get Started
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-32">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest font-semibold text-[#AAA] mb-8">
            <Sparkles className="w-3 h-3 text-white" />
            <span>The Creator Operating System</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Create less manually.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-[#555]">
              Create more intelligently.
            </span>
          </h1>

          <p className="text-[#888] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            CreatorAI transforms long-form content into scripts, highlights, short-form videos, captions, and platform-ready content — all from one intelligent workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="group flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                Start Creating <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="group flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  Start Creating <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            )}

            {isAuthenticated ? (
              <Link href="/studio" className="flex items-center gap-2 bg-[#111] border border-[#333] text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-[#1A1A1A] transition">
                <Wand2 className="w-4 h-4" /> Explore AI Studio
              </Link>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/studio">
                <button className="flex items-center gap-2 bg-[#111] border border-[#333] text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-[#1A1A1A] transition">
                  <Wand2 className="w-4 h-4" /> Explore AI Studio
                </button>
              </SignInButton>
            )}
          </div>
        </section>

        {/* PRODUCT VISUAL */}
        <section id="product" className="max-w-6xl mx-auto px-6 mb-32 relative z-10 scroll-mt-24">
          <div className="relative rounded-2xl bg-[#0A0A0A] border border-[#222] shadow-2xl widget-reflection overflow-hidden aspect-[16/9] md:aspect-[21/9]">
            <div className="absolute top-0 w-full h-10 bg-[#111] border-b border-[#222] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              </div>
              <div className="mx-auto bg-[#050505] border border-[#222] px-24 py-1 rounded text-[10px] font-mono text-[#666]">
                creatorai.com/dashboard
              </div>
            </div>

            <div className="pt-10 h-full flex flex-col md:flex-row bg-[#050505]">
              {/* Fake Sidebar */}
              <div className="hidden md:block w-48 border-r border-[#151515] bg-[#0A0A0A] p-4">
                <div className="space-y-3">
                  <div className="h-4 w-20 bg-[#222] rounded mb-6" />
                  <div className="flex items-center gap-2 text-[#888]"><LayoutDashboard className="w-3 h-3" /><div className="h-2 w-16 bg-[#222] rounded" /></div>
                  <div className="flex items-center gap-2 text-[#888]"><Film className="w-3 h-3" /><div className="h-2 w-24 bg-[#222] rounded" /></div>
                  <div className="flex items-center gap-2 text-white bg-[#151515] p-1.5 -mx-1.5 rounded"><Sparkles className="w-3 h-3" /><div className="h-2 w-20 bg-white/80 rounded" /></div>
                </div>
              </div>
              {/* Fake Content */}
              <div className="flex-1 p-6 flex flex-col gap-4 bg-noise bg-[#050505]">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-32 bg-[#222] rounded" />
                  <div className="h-6 w-24 bg-white/10 border border-white/20 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4 h-full pb-4">
                  <div className="col-span-2 bg-[#0A0A0A] border border-[#151515] widget-reflection rounded-xl flex items-center justify-center relative overflow-hidden">
                    <Play className="w-12 h-12 text-[#333]" />
                    <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[9px] text-[#888] font-mono">SAMPLE_VIDEO_01.MP4</div>
                  </div>
                  <div className="col-span-1 flex flex-col gap-4">
                    <div className="flex-1 bg-[#0A0A0A] border border-[#151515] widget-reflection rounded-xl p-4 space-y-3">
                      <div className="h-3 w-1/2 bg-[#222] rounded" />
                      <div className="h-2 w-full bg-[#151515] rounded" />
                      <div className="h-2 w-4/5 bg-[#151515] rounded" />
                      <div className="h-2 w-full bg-[#151515] rounded" />
                      <div className="mt-4 inline-flex items-center gap-1 text-[9px] font-mono text-[#00FF00] bg-[#00FF00]/10 px-2 py-0.5 rounded border border-[#00FF00]/20"><CheckCircle2 className="w-3 h-3" /> PROCESSING COMPLETE</div>
                    </div>
                    <div className="flex-1 bg-[#0A0A0A] border border-[#151515] rounded-xl p-4 flex flex-col justify-end">
                      <div className="h-8 w-full bg-[#151515] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded border border-[#333]">
              SAMPLE DATA
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-32 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything a creator needs.</h2>
            <p className="text-[#888] text-lg">One intelligent workspace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Film, title: "Media Library", desc: "Organize videos, images and projects." },
              { icon: FileText, title: "AI Script Generator", desc: "Generate scripts, hooks, captions and CTAs." },
              { icon: BrainCircuit, title: "Video Intelligence", desc: "Understand long-form videos through transcription and AI analysis." },
              { icon: Sparkles, title: "AI Highlight Detection", desc: "Discover meaningful short-form moments automatically." },
              { icon: Video, title: "AI Video Editor", desc: "Adjust timing, captions and aspect ratio before rendering." },
              { icon: Share2, title: "Multi-Platform Adaptation", desc: "Adapt content for Instagram, YouTube and LinkedIn." }
            ].map((feature, i) => (
              <div key={i} className="group bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#333] p-8 rounded-2xl transition duration-300 widget-reflection">
                <div className="w-10 h-10 bg-[#111] border border-[#222] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS / WORKFLOW */}
        <section id="workflow" className="max-w-7xl mx-auto px-6 mb-32 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">The Creator Workflow</h2>
            <p className="text-[#888] text-lg">From raw footage to published content.</p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#222] -translate-y-1/2 hidden md:block overflow-hidden">
              <div className="absolute top-0 bottom-0 w-[150px] bg-gradient-to-r from-transparent via-white to-transparent animate-workflow-line opacity-70" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { step: "01", label: "Upload" },
                { step: "02", label: "Transcribe" },
                { step: "03", label: "Understand" },
                { step: "04", label: "Highlights" },
                { step: "05", label: "Clips" },
                { step: "06", label: "Customize" },
                { step: "07", label: "Adapt" },
                { step: "08", label: "Publish" },
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div 
                    className="w-12 h-12 bg-[#050505] border border-[#222] transition-colors rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-[#888] mb-3 animate-workflow-node group-hover:border-white group-hover:text-white"
                    style={{ animationDelay: `${(i / 7) * 8}s` }}
                  >
                    {item.step}
                  </div>
                  <span className="text-xs font-semibold text-[#AAA] group-hover:text-white transition">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI STUDIO & VIDEO INTELLIGENCE */}
        <section id="studio" className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-32 scroll-mt-24">
          {/* AI Studio Panel */}
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:border-[#333] transition widget-reflection">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#222] text-[10px] uppercase tracking-widest font-bold text-white mb-6">
              AI Studio
            </div>

            <h3 className="text-3xl font-bold text-white mb-4 pr-12">Tell CreatorAI what you want to create.</h3>
            <p className="text-[#888] text-sm mb-8 max-w-sm leading-relaxed">
              Generate fully customized scripts, hooks, captions, and platform-specific metadata instantly using our fine-tuned models.
            </p>

            <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-8">
              <div className="text-xs text-[#666] font-mono mb-4">Input</div>
              <div className="text-sm text-white font-medium bg-[#0A0A0A] p-3 rounded border border-[#1A1A1A]">
                "Create a fast-paced 30-second TikTok script about productivity hacks for software engineers. Use a controversial hook."
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 opacity-50">
                <div className="text-[10px] font-semibold text-center border border-[#333] rounded py-1.5">Platform: TikTok</div>
                <div className="text-[10px] font-semibold text-center border border-[#333] rounded py-1.5">Tone: Punchy</div>
                <div className="text-[10px] font-semibold text-center border border-[#333] rounded py-1.5">Dur: 30s</div>
                <div className="text-[10px] font-semibold text-center border border-[#333] rounded py-1.5">Audience: Devs</div>
              </div>
            </div>

            {isAuthenticated ? (
              <Link href="/studio" className="inline-flex items-center justify-center w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-gray-200 transition">
                Try AI Studio
              </Link>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/studio">
                <button className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-gray-200 transition">
                  Try AI Studio
                </button>
              </SignInButton>
            )}
          </div>

          {/* Video Intelligence Panel */}
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:border-[#333] transition widget-reflection">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#222] text-[10px] uppercase tracking-widest font-bold text-white mb-6">
              Video Intelligence
            </div>

            <h3 className="text-3xl font-bold text-white mb-4 pr-12">Extract the best moments automatically.</h3>
            <p className="text-[#888] text-sm mb-8 max-w-sm leading-relaxed">
              Upload long-form podcasts or streams. CreatorAI analyzes the transcript to find highly engaging short-form segments.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl p-3">
                <div className="w-12 h-12 bg-black border border-[#333] rounded flex items-center justify-center flex-shrink-0">
                  <ListVideo className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">"Why React Server Components change everything"</div>
                  <div className="flex gap-2 text-[9px] font-mono text-[#888]">
                    <span>04:15 - 05:02</span>
                    <span className="text-green-400">Viral Score: 92</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl p-3 opacity-50">
                <div className="w-12 h-12 bg-black border border-[#333] rounded flex items-center justify-center flex-shrink-0">
                  <ListVideo className="w-4 h-4 text-[#666]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#888] mb-0.5">"The state of frontend in 2024"</div>
                  <div className="flex gap-2 text-[9px] font-mono text-[#555]">
                    <span>12:30 - 13:45</span>
                    <span>Viral Score: 85</span>
                  </div>
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <Link href="/media" className="inline-flex items-center justify-center w-full bg-transparent border border-[#333] text-white font-bold text-sm py-3 rounded-lg hover:bg-[#111] transition">
                Upload a Video
              </Link>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/media">
                <button className="w-full bg-transparent border border-[#333] text-white font-bold text-sm py-3 rounded-lg hover:bg-[#111] transition">
                  Upload a Video
                </button>
              </SignInButton>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#111] py-12 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <LayoutDashboard className="w-3 h-3 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">CreatorAI</span>
          </div>
          <div className="text-[10px] text-[#666] font-mono">
            &copy; {new Date().getFullYear()} CreatorAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
