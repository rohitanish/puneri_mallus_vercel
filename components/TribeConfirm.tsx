"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface TribeConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function TribeConfirm({ isOpen, title, message, onConfirm, onCancel, loading }: TribeConfirmProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
          >
            {/* Visual Warning Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-brandRed/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-brandRed/10 border border-brandRed/20 rounded-2xl flex items-center justify-center text-brandRed mb-8">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  {title}
                </h3>
                <p className="text-sm font-bold text-zinc-500 leading-relaxed uppercase tracking-widest italic">
                  {message}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full py-4 bg-brandRed text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Processing Access Termination..." : "Confirm"}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full py-4 bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                >
                  Cancel Action
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}