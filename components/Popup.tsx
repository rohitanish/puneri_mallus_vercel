"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function BusinessCollabAd() {
  const [adData, setAdData] = useState<any>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    async function fetchCollab() {
      try {
        const response = await fetch('/api/admin/popup');
        const result = await response.json();
        
        if (result.show) {
          setAdData(result.data);
          
          // 1. APPEARANCE DELAY: Uses 'delay' from DB or defaults to 3s
          const appearanceDelay = result.data.delay || 3000;
          const showTimer = setTimeout(() => {
            setIsPopupOpen(true);
          }, appearanceDelay);

          // 2. AUTO-DISMISSAL: Uses 'duration' from DB or defaults to 10s
          const stayDuration = result.data.duration || 10000;
          const hideTimer = setTimeout(() => {
            setIsPopupOpen(false);
            setHasDismissed(true);
          }, appearanceDelay + stayDuration);

          return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
          };
        }
      } catch (e) {
        console.error("Collab fetch failed", e);
      }
    }
    fetchCollab();
  }, []);

  const handleClose = () => {
    setIsPopupOpen(false);
    setHasDismissed(true);
  };

  // Dismiss the badge tab entirely
  const handleDismissBadge = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasDismissed(false);
  };

  if (!adData) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,600&family=Geist+Mono:wght@300;400;500&display=swap');

        .collab-font-display { font-family: 'Cormorant Garamond', serif; }
        .collab-font-mono { font-family: 'Geist Mono', monospace; }

        .collab-badge-pill {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .collab-tab-image {
          border: 1px solid rgba(255,255,255,0.08);
          border-right: none;
          box-shadow: -8px 0 32px rgba(0,0,0,0.8);
        }

        .collab-modal {
          background: #080808;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 40px 80px rgba(0,0,0,0.9),
            0 0 120px rgba(200,160,80,0.04);
        }

        .collab-image-overlay {
          background: linear-gradient(
            to bottom,
            rgba(8,8,8,0) 0%,
            rgba(8,8,8,0.1) 40%,
            rgba(8,8,8,0.85) 80%,
            rgba(8,8,8,1) 100%
          );
        }

        .collab-cta {
          background: linear-gradient(135deg, #c8a050 0%, #e8c070 50%, #c8a050 100%);
          background-size: 200% 200%;
          transition: background-position 0.6s ease, box-shadow 0.3s ease, transform 0.15s ease;
          box-shadow: 0 8px 32px rgba(200,160,80,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .collab-cta:hover {
          background-position: right center;
          box-shadow: 0 12px 48px rgba(200,160,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .collab-cta:active { transform: scale(0.98); }

        .collab-close {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 0.2s, border-color 0.2s;
        }

        .collab-close:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.15);
        }

        .collab-tag {
          background: rgba(200,160,80,0.08);
          border: 1px solid rgba(200,160,80,0.2);
        }

        .collab-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shimmer 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 10;
        }

        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .collab-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 1px solid rgba(200,160,80,0.3);
          animation: pulse-ring 2.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.3); }
        }

        .collab-badge-x {
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.12);
          transition: background 0.2s, border-color 0.2s;
        }

        .collab-badge-x:hover {
          background: rgba(200,160,80,0.25);
          border-color: rgba(200,160,80,0.4);
        }
      `}</style>

      {/* MINIFIED PARTNER BADGE */}
      <AnimatePresence>
        {hasDismissed && !isPopupOpen && (
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-[1000] flex items-center group"
          >
            {/* Badge dismiss X — appears on hover */}
            <button
              onClick={handleDismissBadge}
              className="collab-badge-x absolute -top-2.5 -left-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Dismiss badge"
            >
              <X size={9} className="text-white/70" />
            </button>

            <button
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center"
              aria-label="Open partner offer"
            >
              <motion.div
                className="collab-badge-pill py-4 rounded-l-2xl overflow-hidden"
                initial={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0 }}
                whileHover={{ width: 'auto', opacity: 1, paddingLeft: 20, paddingRight: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="collab-font-mono text-[8px] tracking-[0.3em] uppercase text-[#c8a050] whitespace-nowrap mb-1">
                  Partner Offer
                </p>
                <p className="collab-font-display text-[13px] font-light text-white whitespace-nowrap italic truncate max-w-[120px]">
                  {adData.title}
                </p>
              </motion.div>

              <div className="relative w-14 h-20 collab-tab-image rounded-l-2xl overflow-hidden">
                <div className="collab-pulse-ring rounded-l-2xl" />
                <Image
                  src={adData.imageUrl}
                  alt="Partner"
                  fill
                  className="object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-500 scale-110 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#c8a050] to-transparent opacity-60" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COLLABORATION POPUP */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={handleClose}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.98) 100%)',
                backdropFilter: 'blur(24px)'
              }}
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full sm:max-w-[440px] collab-modal rounded-t-[28px] sm:rounded-[32px] overflow-hidden"
            >
              <div className="collab-shimmer" />

              {/* Image section */}
              <div className="relative h-[200px] sm:h-[260px] w-full overflow-hidden">
                <Image
                  src={adData.imageUrl}
                  alt="Partner"
                  fill
                  className="object-cover scale-105"
                  priority
                  style={{ filter: 'saturate(0.7) contrast(1.1)' }}
                />
                <div className="collab-image-overlay absolute inset-0" />

                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 sm:px-7 pt-5 sm:pt-6">
                  <div className="collab-tag collab-font-mono flex items-center gap-2 px-3 py-1.5 rounded-full">
                    <ShieldCheck size={10} className="text-[#c8a050]" />
                    <span className="text-[8px] tracking-[0.25em] uppercase text-[#c8a050]">Verified Partner</span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="collab-close p-2 rounded-full text-white/40 hover:text-white/80"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-5 sm:pb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-[1px] w-6 flex-shrink-0"
                      style={{ background: 'linear-gradient(90deg, #c8a050 0%, rgba(200,160,80,0.2) 100%)' }}
                    />
                    <span className="collab-font-mono text-[8px] tracking-[0.35em] uppercase text-[#c8a050]/70">
                      Official Collaboration
                    </span>
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="px-6 sm:px-9 pt-6 sm:pt-8 pb-7 sm:pb-9">
                <p className="collab-font-mono text-[8px] tracking-[0.4em] uppercase text-white/20 mb-4 sm:mb-5">
                  Sponsored · Exclusive
                </p>

                <h2 className="collab-font-display text-[30px] sm:text-[38px] font-light italic text-white leading-[0.88] tracking-tight mb-3 sm:mb-4">
                  {adData.title}
                </h2>

                <p className="collab-font-mono text-[10px] text-white/30 tracking-wider leading-relaxed mb-6 sm:mb-8 font-light">
                  {adData.subtitle}
                </p>

                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                  <div
                    className="h-[1px] flex-1"
                    style={{ background: 'linear-gradient(90deg, rgba(200,160,80,0.4), transparent)' }}
                  />
                  <div className="w-1 h-1 rounded-full bg-[#c8a050]/40" />
                  <div
                    className="h-[1px] flex-1"
                    style={{ background: 'linear-gradient(270deg, rgba(200,160,80,0.4), transparent)' }}
                  />
                </div>

                <Link
                  href={adData.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="collab-cta group w-full py-[15px] sm:py-[18px] rounded-2xl flex items-center justify-center gap-3"
                >
                  <span className="collab-font-mono text-[10px] tracking-[0.3em] uppercase text-black font-medium">
                    View Partnership
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-black/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                  />
                </Link>

                <p className="collab-font-mono text-center text-[8px] text-white/10 tracking-widest mt-4 sm:mt-5 uppercase">
                  Paid partnership
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}