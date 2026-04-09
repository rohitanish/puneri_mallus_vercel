"use client";
import { ShieldCheck, Lock, Eye, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const sections = [
    {
      title: "Data Transmission",
      content: "We collect minimal identification data including email and name during Tribe registration to initialize community pages. Your data is encrypted and stored via Supabase secure protocols."
    },
    {
      title: "Visual Assets",
      content: "Images uploaded to the Archive or Event posters are hosted on public buckets. By uploading, you grant the community rights to display these assets across the PM Terminal."
    },
    {
      title: "Tracking Protocols",
      content: "We use essential cookies to maintain your session status. No third-party behavioral tracking is injected into the cinematic experience."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-40 pb-20 px-6 selection:bg-brandRed/30">
      <div className="max-w-4xl mx-auto space-y-20">
        
        {/* Header */}
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white uppercase font-black text-[10px] tracking-[0.4em] transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Start
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
            Privacy <span className="text-brandRed">Protocol.</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-xs">Version 1.0.26 // Secure Node</p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-12">
          {sections.map((sec, i) => (
            <div key={i} className="bg-zinc-950 border border-white/5 p-10 rounded-[40px] space-y-6 group hover:border-brandRed/20 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-brandRed/10 flex items-center justify-center border border-brandRed/20">
                    <ShieldCheck className="text-brandRed" size={24} />
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">{sec.title}</h2>
              </div>
              <p className="text-zinc-500 font-bold uppercase leading-loose tracking-widest text-xs">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-white/5 text-center">
           <p className="text-zinc-800 font-black uppercase tracking-[0.8em] text-[10px]">End of Transmission</p>
        </div>
      </div>
    </div>
  );
}