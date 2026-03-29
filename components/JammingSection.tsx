"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Music } from 'lucide-react';

export default function JammingSection({ cycle }: { cycle: boolean }) {
  const fullText = "LIVE SESSIONS";
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);

  // Typewriter Engine
  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <section className="max-w-7xl mx-auto mb-40 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* LEFT SIDE: HYBRID VISUAL LOOP */}
        <div className="lg:col-span-7 relative h-[600px] rounded-[60px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] group">
          {/* Static Image Layer */}
          <Image 
  src="/about/image_1.jpeg" 
  alt="Jamming" 
  fill 
  // Tells the browser to load 100% width on mobile and 50% on desktop
  sizes="(max-width: 768px) 100vw, 50vw" 
  className={`object-cover transition-opacity duration-1000 ease-in-out ${cycle ? 'opacity-0' : 'opacity-80'}`} 
/>
          
          {/* Video Layer */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${cycle ? 'opacity-80' : 'opacity-0'}`}
          >
            <source src="/videos/jam.mp4" type="video/mp4" />
          </video>

          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
        </div>

        {/* RIGHT SIDE: TYPOGRAPHY & TYPEWRITER */}
        <div className="lg:col-span-5 flex flex-col justify-center relative py-20 lg:py-0">
          
          {/* BACKGROUND GHOST TEXT */}
          <h2 className="text-8xl md:text-[140px] font-black uppercase italic tracking-tighter leading-[0.7] text-white/[0.03] select-none absolute -translate-x-10 lg:-translate-x-20 top-1/2 -translate-y-1/2 -z-10 pointer-events-none">
            RHYTHM
          </h2>

          <div className="space-y-6 relative z-10">
            {/* TYPEWRITER SUBHEADER */}
            <div className="flex items-center gap-4 text-brandRed">
              <Music size={24} className="animate-pulse" />
              <span className="font-mono uppercase tracking-[0.5em] text-xs font-black flex items-center">
                {displayText}
                <span className="w-2 h-4 bg-brandRed ml-1 animate-[blink_1s_infinite]" />
              </span>
            </div>

            {/* MAIN HEADING */}
            <h3 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] text-white group">
              The <span className="text-brandRed drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all duration-500">Jamming</span> <br />
              <span className="inline-block hover:translate-x-2 transition-transform duration-500">Sessions.</span>
            </h3>

            {/* DESCRIPTION */}
            <p className="text-xl text-zinc-500 italic leading-relaxed max-w-md border-l-2 border-brandRed/20 pl-6">
              Raw musical energy recreating the magic of Kerala unplugged. Where every beat tells a story of home.
            </p>
          </div>
        </div>
      </div>

      {/* Global CSS for the cursor blink */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}