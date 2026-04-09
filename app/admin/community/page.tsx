"use client";
import { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, Edit3, Plus, Users, Globe, 
  Loader2, Search, X, MapPin, ShieldCheck, Zap,
  Eye, EyeOff, CheckCircle, Clock, Check, ExternalLink
} from 'lucide-react'; // Added ExternalLink
import Link from 'next/link';
import TribeConfirm from '@/components/TribeConfirm';
import { useAlert } from '@/context/AlertContext';

// TAB DEFINITIONS
const TABS = [
  { id: 'ALL', label: 'All Communities' },
  { id: 'PENDING', label: 'Pending Review' },
  { id: 'LIVE', label: 'Live on Grid' }
];

export default function CommunityAdmin() {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [activeTab, setActiveTab] = useState('ALL');
  const { showAlert } = useAlert();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community?admin=true');
      const data = await res.json();
      setCircles(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error(error); 
      showAlert("Sync Failed", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCircles(); }, []);

  const toggleApproval = async (circle: any) => {
    try {
      // 1. GET THE ADMIN NAME
      
      
      const res = await fetch('/api/community/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          _id: circle._id, 
          isApproved: !circle.isApproved
          
        })
      });

      if (res.ok) {
        setCircles(circles.map(c => 
          c._id === circle._id ? { ...c, isApproved: !c.isApproved } : c
        ));
        showAlert(circle.isApproved ? "Node Hidden" : "Node Approved & Live", "success");
      }
    } catch (error) { showAlert("Approval failed", "error"); }
  };

  const filteredCircles = useMemo(() => {
    return circles.filter(c => {
      const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'ALL' || 
                         (activeTab === 'PENDING' && !c.isApproved) || 
                         (activeTab === 'LIVE' && c.isApproved);

      return matchesSearch && matchesTab;
    });
  }, [circles, searchQuery, activeTab]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/community/delete?id=${itemToDelete._id}`, { method: 'DELETE' });
      if (res.ok) {
        setCircles(circles.filter(c => c._id !== itemToDelete._id));
        showAlert("Node Dissolved", "success");
      }
    } catch (error) { showAlert("Action failed", "error"); }
    finally { setConfirmOpen(false); }
  };

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6 lg:px-16 text-white text-glow">
      <TribeConfirm 
        isOpen={confirmOpen} 
        title="Dissolve Community" 
        message={`Remove "${itemToDelete?.title}" permanently?`} 
        onConfirm={handleDelete} 
        onCancel={() => setConfirmOpen(false)} 
      />

      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Community <span className="text-cyan-400">Hub .</span></h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {circles.filter(c => !c.isApproved).length} Community Awaiting Clearance // {circles.filter(c => c.isApproved).length} Communities Live
            </p>
          </div>
          
          <Link href="/admin/community/list">
            <button className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-xl">
              <Plus size={16} /> Add Organization
            </button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/20 p-4 rounded-[30px] border border-white/5 backdrop-blur-sm">
          <div className="flex bg-black p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' : 'text-zinc-500 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              placeholder="FILTER NODES..." 
              className="w-full bg-black border border-white/10 p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-cyan-400 transition-all"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCircles.map((circle) => (
              <div key={circle._id} className={`group relative bg-zinc-950 border rounded-[40px] overflow-hidden transition-all duration-500 ${!circle.isApproved ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.05)]' : 'border-white/5 hover:border-cyan-400/30'}`}>
                
                <div className={`absolute top-6 left-6 z-20 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border ${circle.isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                   {circle.isApproved ? <CheckCircle size={10}/> : <Clock size={10}/>}
                   {circle.isApproved ? 'Live' : 'Pending Review'}
                </div>

                <div className="h-52 relative overflow-hidden">
                  <img src={circle.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-all duration-1000 group-hover:scale-110" alt="Node" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  
                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                      {/* PREVIEW BUTTON - Opens your Details Page in new tab */}
                      <Link 
                        href={`/community/${circle._id}`} 
                        target="_blank" 
                        className="p-3 bg-black/60 backdrop-blur-md rounded-xl hover:text-cyan-400 transition-all border border-white/10"
                        title="Preview Content"
                      >
                        <ExternalLink size={16}/>
                      </Link>

                      <button 
                        onClick={() => toggleApproval(circle)} 
                        title={circle.isApproved ? "Revoke Approval" : "Approve Node"} 
                        className={`p-3 backdrop-blur-md rounded-xl transition-all border border-white/10 ${circle.isApproved ? 'bg-black/60 text-zinc-400 hover:text-amber-400' : 'bg-brandRed text-white shadow-lg shadow-red-500/30'}`}
                      >
                        {circle.isApproved ? <EyeOff size={16}/> : <Check size={16} strokeWidth={3}/>}
                      </button>
                      
                      <Link href={`/admin/community/list?edit=${circle._id}`} className="p-3 bg-black/60 backdrop-blur-md rounded-xl hover:text-cyan-400 transition-all border border-white/10"><Edit3 size={16}/></Link>
                      <button onClick={() => { setItemToDelete(circle); setConfirmOpen(true); }} className="p-3 bg-black/60 backdrop-blur-md rounded-xl hover:text-red-500 transition-all border border-white/10"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-cyan-400 font-black text-[9px] uppercase tracking-[0.3em]">{circle.category}</span>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-cyan-400 transition-colors">{circle.title}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase">
                      <MapPin size={12} /> {circle.area}
                    </div>
                    {circle.submittedBy && (
                      <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        <Users size={10} /> {circle.submittedBy.split('@')[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCircles.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[40px]">
            <Search size={30} className="text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">No nodes found in this sector</p>
          </div>
        )}
      </div>
    </div>
  );
}