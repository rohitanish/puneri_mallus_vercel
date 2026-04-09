"use client";
import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Trash2, Search, Loader2, 
  MapPin, ExternalLink, Globe, Instagram, MessageCircle, X, Check
} from 'lucide-react';
import Image from 'next/image';
import TribeConfirm from '@/components/TribeConfirm';
import { useAlert } from '@/context/AlertContext';

export default function AdminMartManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { showAlert } = useAlert();

  // Deletion State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/mart');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      showAlert("Terminal Connection Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/mart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVerified: !currentStatus })
      });
      if (res.ok) {
        setItems(items.map(item => item._id === id ? { ...item, isVerified: !currentStatus } : item));
        showAlert(!currentStatus ? "Business Verified" : "Verification Revoked", "success");
      }
    } catch (err) {
      showAlert("Sync Failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch('/api/mart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: itemToDelete._id, 
          imagePaths: itemToDelete.imagePaths || [itemToDelete.imagePath] 
        })
      });
      if (res.ok) {
        setItems(items.filter(i => i._id !== itemToDelete._id));
        setConfirmOpen(false);
        showAlert("Professional Purged", "success");
      }
    } catch (err) {
      showAlert("Purge Protocol Failed", "error");
    }
  };

  const filtered = useMemo(() => {
    return items.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-brandRed" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6 lg:px-16 text-white">
      <TribeConfirm 
        isOpen={confirmOpen}
        title="Purge Listing"
        message={`Warning: You are permanently removing "${itemToDelete?.name}". All visual assets and meta-data will be wiped.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
              Mart <span className="text-brandRed">Audit .</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              System Overlook // {items.length} Registered Business
            </p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brandRed" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BUSINESS OR EMAIL..."
              className="w-full bg-zinc-950 border border-white/5 p-4 pl-12 rounded-2xl text-[10px] font-black tracking-widest focus:border-brandRed outline-none"
            />
          </div>
        </div>

        {/* Audit Table */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div key={item._id} className="bg-zinc-950 border border-white/5 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-8 hover:bg-zinc-900/50 transition-all group">
              {/* Thumbnail */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black shrink-0 relative">
                <Image 
                  src={`https://bhfrgcphqmbocplfcvbg.supabase.co/storage/v1/object/public/mallu-mart/${item.imagePaths?.[0] || item.imagePath}`}
                  alt="Thumb" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h3 className="text-xl font-black uppercase italic">{item.name}</h3>
                  {item.isVerified && <ShieldCheck className="text-brandRed" size={18} />}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <span className="text-brandRed">{item.category}</span>
                  <span>{item.area}</span>
                  <span className="text-zinc-700">{item.userEmail}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleVerify(item._id, item.isVerified)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    item.isVerified 
                    ? 'bg-brandRed text-white shadow-[0_0_20px_#FF0000]' 
                    : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'
                  }`}
                >
                  {item.isVerified ? <Check size={14} /> : <ShieldCheck size={14} />}
                  {item.isVerified ? 'Verified' : 'Verify'}
                </button>

                <button 
                  onClick={() => { setItemToDelete(item); setConfirmOpen(true); }}
                  className="p-3 bg-zinc-900 text-zinc-600 hover:text-brandRed hover:bg-brandRed/10 rounded-xl transition-all border border-white/5"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}