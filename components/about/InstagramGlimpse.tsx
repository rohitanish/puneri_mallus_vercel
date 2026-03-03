"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Instagram, ArrowUpRight, Loader2, Play } from 'lucide-react';

export default function InstagramGlimpse() {
  const [instaPosts, setInstaPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSocial() {
      try {
        const res = await fetch('/api/settings/social');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setInstaPosts(data);
        } else {
          // Default placeholders if database is empty
          const defaults = Array(3).fill({
            mediaUrl: '/gallery/placeholder.jpg',
            link: '#',
            useLinkAsThumbnail: true,
            manualThumb: ''
          });
          setInstaPosts(defaults);
        }
      } catch (err) {
        console.error("Failed to load social pulse", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSocial();
  }, []);

  const isVideo = (url: string) => {
    return url?.match(/\.(mp4|webm|ogg|mov)/i) || url?.includes("video");
  };

  return (
    <section className="max-w-7xl mx-auto mb-40 px-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/5 rounded-full mb-4">
            <Instagram size={12} className="text-brandRed" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Social Pulse</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
            On The <span className="text-brandRed text-outline">Gram.</span>
          </h2>
        </div>
        <a 
          href="https://www.instagram.com/puneri_mallus?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-3 bg-zinc-950 border border-white/10 px-8 py-4 rounded-2xl hover:border-brandRed transition-all duration-500"
        >
          <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-brandRed transition-colors">Follow Tribe</span>
          <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-brandRed group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
        </a>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="aspect-square rounded-[40px] bg-zinc-900/40 animate-pulse border border-white/5" />
          ))
        ) : (
          instaPosts.map((post, idx) => {
            // LOGIC: If checkbox 'useLinkAsThumbnail' is true, use mediaUrl. 
            // Otherwise, use the manualThumb provided.
            const thumbSource = post.useLinkAsThumbnail ? post.mediaUrl : post.manualThumb;
            const finalMedia = thumbSource && thumbSource.trim() !== "" ? thumbSource : "/gallery/placeholder.jpg";
            const mediaIsVideo = isVideo(finalMedia);
            
            return (
              <a 
                key={idx} 
                href={post.link || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-[40px] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl transition-all duration-500 hover:border-brandRed/30"
              >
                {mediaIsVideo ? (
                  <video 
                    src={finalMedia}
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <Image 
                    src={finalMedia} 
                    alt={`Tribe Post ${idx + 1}`} 
                    fill 
                    className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2 opacity-90 group-hover:opacity-100"
                  />
                )}

                {/* Video Play Icon Indicator */}
                {mediaIsVideo && (
                  <div className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 group-hover:opacity-0 transition-opacity">
                    <Play size={12} className="text-white fill-current" />
                  </div>
                )}

                {/* HOVER OVERLAY */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="bg-brandRed p-5 rounded-full mb-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-500 shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                    <Instagram size={28} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white translate-y-10 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    Open in Instagram
                  </span>
                  
                  {/* Subtle Brand Laser Line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-brandRed scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </section>
  );
}