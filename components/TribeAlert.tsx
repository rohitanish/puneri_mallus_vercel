"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

interface TribeAlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export default function TribeAlert({ message, type, isVisible, onClose }: TribeAlertProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000); // Auto close after 4s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const typeConfig = {
    success: {
      border: 'border-emerald-500/30',
      glow: 'bg-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconText: 'text-emerald-500',
      Icon: CheckCircle2,
      bar: 'bg-emerald-500'
    },
    error: {
      border: 'border-brandRed/30',
      glow: 'bg-brandRed',
      iconBg: 'bg-brandRed/10',
      iconText: 'text-brandRed',
      Icon: AlertCircle,
      bar: 'bg-brandRed'
    },
    info: {
      border: 'border-blue-500/30',
      glow: 'bg-blue-500',
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-500',
      Icon: Info,
      bar: 'bg-blue-500'
    }
  };

  const currentTheme = typeConfig[type] || typeConfig.info;
  const ActiveIcon = currentTheme.Icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          // 🔥 FIX: Bulletproof mobile centering. Locks to screen edges and auto-centers.
          className="fixed bottom-10 left-0 right-0 mx-auto z-[9999] w-[calc(100%-2rem)] max-w-md"
        >
          <div className={`relative overflow-hidden backdrop-blur-xl border p-4 sm:p-5 rounded-[24px] shadow-2xl flex items-center gap-3 sm:gap-4 bg-zinc-950/80 ${currentTheme.border}`}>
            
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[50px] opacity-20 rounded-full ${currentTheme.glow}`} />

            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${currentTheme.iconBg} ${currentTheme.iconText}`}>
              <ActiveIcon size={20} className="sm:w-6 sm:h-6" />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 truncate">
                System Message
              </p>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight italic break-words">
                {message}
              </p>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="shrink-0 p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 relative z-10"
            >
              <X size={18} />
            </button>

            {/* Progress Bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${currentTheme.bar}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}