"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';
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
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
        >
          <div className={`relative overflow-hidden backdrop-blur-xl border p-5 rounded-[24px] shadow-2xl flex items-center gap-4 ${
            type === 'success' 
              ? 'bg-zinc-950/80 border-emerald-500/30' 
              : type === 'error' 
              ? 'bg-zinc-950/80 border-brandRed/30' 
              : 'bg-zinc-950/80 border-white/10'
          }`}>
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[50px] opacity-20 rounded-full ${
              type === 'success' ? 'bg-emerald-500' : 'bg-brandRed'
            }`} />

            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
              type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brandRed/10 text-brandRed'
            }`}>
              {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                System Message
              </p>
              <p className="text-sm font-bold text-white leading-tight italic">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500"
            >
              <X size={18} />
            </button>

            {/* Progress Bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${
                type === 'success' ? 'bg-emerald-500' : 'bg-brandRed'
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}