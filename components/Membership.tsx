"use client";
import { useState } from 'react';
import { Crown, CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAlert } from '@/context/AlertContext';

interface MembershipCardProps {
  price: number;
  benefits: string[];
  userId: string;
  userEmail: string;
}

export default function MembershipCard({ price, benefits, userId, userEmail }: MembershipCardProps) {
  const [upgrading, setUpgrading] = useState(false);
  const { showAlert } = useAlert();

  const handleJoin = async () => {
    if (!userId) {
      showAlert("Identity Required. Please login.", "error");
      return;
    }

    setUpgrading(true);
    try {
      // 1. Create Order for LIFETIME membership
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentType: 'LIFETIME',
          amount: price // 🔥 NOW THE COMPONENT PROP DICTATES THE ACTUAL CHARGE!
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Razorpay Configuration
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "PUNERI MALLUS",
        description: "Lifetime Inner Circle Access",
        order_id: orderData.id,
        method: {
    netbanking: true,
    card: true,
    upi: true,
    wallet: true,
    emi: false,      // Explicitly disabled
    paylater: false  // Explicitly disabled
  },
        // 🔥 FORCE UPI FOR THAT WHATSAPP-STYLE UX
        config: {
          display: {
            blocks: {
              
            },
            sequence: ['block.banks', 'block.cards'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async function (response: any) {
          // 3. Verify and Grant Global Access via our unified route
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userId,
              paymentType: 'LIFETIME', // 🔥 COMMA ADDED HERE
              userEmail: userEmail // 🔥 FIXED VARIABLE NAME
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            showAlert("Welcome to the Inner Circle!", "success");
            window.location.reload(); // Refresh to flip the UI to Premium state
          }
        },
        prefill: { email: userEmail },
        theme: { color: "#FF0000" },
        modal: { ondismiss: () => setUpgrading(false) }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      showAlert(err.message || "Checkout failed", "error");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-zinc-950 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden group shadow-2xl"
    >
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-brandRed/10 blur-[120px] rounded-full group-hover:bg-brandRed/15 transition-all duration-700" />
      
      <div className="relative z-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brandRed rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] shrink-0">
              <Crown className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Lifetime Membership</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-brandRed">Official Tribe Protocol</p>
            </div>
          </div>
          
          <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Secure One-Time</p>
            <h4 className="text-3xl font-black italic text-white uppercase tracking-tighter">
              ₹{price}<span className="text-brandRed text-sm not-italic">.00</span>
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5 pb-4">
            Inner Circle Entitlements
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 group/item">
                <CheckCircle2 size={16} className="text-brandRed shrink-0" />
                <p className="text-[11px] font-bold uppercase tracking-tight text-zinc-300">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <button 
            disabled={upgrading}
            onClick={handleJoin}
            className="w-full h-20 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-brandRed hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 text-xs disabled:opacity-50"
          >
            {upgrading ? <Loader2 className="animate-spin" /> : <>Execute Membership <ArrowRight size={18} /></>}
          </button>
          
          <div className="flex items-center justify-center gap-2 opacity-40">
            <ShieldCheck size={14} className="text-zinc-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Razorpay Verified Gateway</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}