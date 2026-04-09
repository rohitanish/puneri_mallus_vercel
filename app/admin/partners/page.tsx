"use client";
import { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, Edit3, Plus, Globe, Instagram, 
  Loader2, Search, X, ShieldCheck, Zap, Eye, Handshake, Star, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TribeConfirm from '@/components/TribeConfirm';
import { useAlert } from '@/context/AlertContext';

// EXACT HIERARCHY FOR CONSISTENT ADMIN VIEW
const HIERARCHY = [
  "Advisory Board",
  "Board of Trustees", 
  "Executive Council", 
  "Trailblazers Panel"
];

export default function PartnerAdmin() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  const { showAlert } = useAlert();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partners');
      const data = await res.json();
      setPartners(data);
    } catch (error) { 
      console.error("Failed to fetch members:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/partners/delete?id=${itemToDelete._id}`, { method: 'DELETE' });
      if (res.ok) {
        setPartners(partners.filter(p => p._id !== itemToDelete._id));
        showAlert("Member Removed", "success");
      }
    } catch (error) { 
      showAlert("Operation failed", "error"); 
    } finally { 
      setConfirmOpen(false); 
      setItemToDelete(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-brandRed" size={40} strokeWidth={1} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6 lg:px-16 text-white selection:bg-brandRed/30">
      
      <TribeConfirm 
        isOpen={confirmOpen} 
        title="Remove Member" 
        message={`Confirm: Remove "${itemToDelete?.name}" from the structural grid?`} 
        onConfirm={handleDelete} 
        onCancel={() => setConfirmOpen(false)} 
      />

      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-10">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-brandRed font-black uppercase text-[10px] tracking-[0.3em]">
              <ShieldCheck size={12} fill="currentColor" /> Structural Grid Management
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
              Network <span className="text-brandRed">Partners .</span>
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brandRed" size={16} />
              <input 
                placeholder="SEARCH MEMBERS..." 
                className="w-full bg-zinc-900/50 border border-white/10 p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-brandRed transition-all"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/admin/partners/list">
              <button className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brandRed hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                <Plus size={16} /> Add Member
              </button>
            </Link>
          </div>
        </div>

        {/* SECTIONAL GRID BASED ON HIERARCHY */}
        <div className="space-y-24">
          {HIERARCHY.map((cat) => {
            const sectionMembers = partners.filter(p => 
              p.category === cat && 
              (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               p.perk?.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            if (sectionMembers.length === 0) return null;

            return (
              <section key={cat} className="space-y-10">
                {/* SECTION DIVIDER */}
                <div className="flex items-center gap-6">
                  <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-zinc-400">
                    {cat} <span className="text-[10px] not-italic text-zinc-600 ml-2">// {sectionMembers.length} ACTIVE</span>
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sectionMembers.map((member) => (
                    <div key={member._id} className="group bg-zinc-950 border border-white/5 rounded-[40px] overflow-hidden hover:border-brandRed/30 transition-all duration-500 shadow-2xl flex flex-col">
                      
                      {/* MEMBER ASSET SECTION */}
                      <div className="h-56 relative bg-white/[0.01] flex items-center justify-center overflow-hidden border-b border-white/5">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl group-hover:border-brandRed transition-all duration-500">
                          <Image 
                            src={member.image || "/about/placeholder.jpeg"} 
                            alt={member.name} 
                            fill 
                            className="object-cover transition-all duration-700 group-hover:scale-110" 
                            unoptimized
                          />
                        </div>
                        
                        {/* FLOATING ACTION OVERLAY */}
                        <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                           <Link 
                             href={`/partners/${member._id}`} 
                             className="p-3 bg-white text-black rounded-xl hover:bg-brandRed hover:text-white transition-all shadow-xl"
                           >
                              <Eye size={16}/>
                           </Link>
                           
                           <Link 
                             href={`/admin/partners/list?edit=${member._id}`} 
                             className="p-3 bg-zinc-900 text-white rounded-xl hover:text-brandRed border border-white/10 transition-all"
                           >
                              <Edit3 size={16}/>
                           </Link>
                           
                           <button 
                             onClick={() => { setItemToDelete(member); setConfirmOpen(true); }} 
                             className="p-3 bg-zinc-900 text-white rounded-xl hover:text-red-500 border border-white/10 transition-all"
                           >
                              <Trash2 size={16}/>
                           </button>
                        </div>
                      </div>

                      {/* MEMBER INFO */}
                      <div className="p-8 space-y-4 flex-1 flex flex-col">
                        <div className="space-y-1 text-center">
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-brandRed transition-colors">
                            {member.name}
                          </h3>
                          {member.perk && (
                            <div className="flex items-center justify-center gap-2 text-zinc-500">
                               <Briefcase size={12} className="text-brandRed" />
                               <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
                                  {member.perk}
                                </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-6 pt-6 border-t border-white/5 mt-auto">
                           {member.link && <Globe size={14} className="text-zinc-700 hover:text-white" />}
                           {member.instagram && <Instagram size={14} className="text-zinc-700 hover:text-white" />}
                           {member.whatsapp && <Handshake size={14} className="text-zinc-700 hover:text-white" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {partners.length === 0 && !loading && (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[50px] bg-zinc-950/20">
                <ShieldCheck size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-600 font-black uppercase text-xs tracking-[0.3em]">Grid is currently offline</p>
                <Link href="/admin/partners/list">
                  <button className="mt-6 text-brandRed font-black uppercase text-[10px] hover:underline">Add First Member</button>
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}