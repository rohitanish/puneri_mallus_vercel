"use client";
import { Scale, Zap, AlertCircle, ArrowLeft, Gavel } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const terms = [
    {
      title: "Community Conduct",
      content: "Tribe members must maintain the spirit of 'Zero Divides'. Any injection of hate speech, political friction, or harassment will result in immediate  termination."
    },
    {
      title: "Asset Ownership",
      content: "All brand logos, cinematic slider assets, and event designs are intellectual property of Puneri Mallus. Unauthorized replication is a protocol violation."
    },
    {
      title: "Event Liability",
      content: "The PM Portal serves as a sequencer for community jams. We are not responsible for physical occurrences at external venues linked through the terminal."
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
            Terms of <span className="text-brandRed">Tribe.</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-xs">Operational Guidelines // Pune Hub</p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-12">
          {terms.map((term, i) => (
            <div key={i} className="bg-zinc-950 border border-white/5 p-10 rounded-[40px] space-y-6 group hover:border-brandRed/20 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Gavel className="text-white" size={24} />
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">{term.title}</h2>
              </div>
              <p className="text-zinc-500 font-bold uppercase leading-loose tracking-widest text-xs">
                {term.content}
              </p>
            </div>
          ))}
        </div>

        <div className="p-10 bg-brandRed/5 border border-brandRed/10 rounded-[40px] flex items-center gap-6">
           <Zap className="text-brandRed shrink-0" size={32} />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandRed leading-relaxed">
             By accessing this terminal, you agree to uphold the cinematic and cultural integrity of the Puneri Mallus community.
           </p>
        </div>
      </div>
    </div>
  );
}