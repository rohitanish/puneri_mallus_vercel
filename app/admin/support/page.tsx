"use client";
import { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Trash2, CheckCircle, Clock, 
  ArrowLeft, ExternalLink, Loader2, MessageSquare,
  ShieldCheck, Inbox, Search, X, Filter,RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { useAlert } from '@/context/AlertContext';

export default function SupportTerminal() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // Filter State
  const { showAlert } = useAlert();

  const fetchTickets = async () => {
    const res = await fetch('/api/admin/support');
    const data = await res.json();
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  // --- DYNAMIC FILTER & SEARCH LOGIC ---
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket: any) => {
      const matchesSearch = 
        ticket.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === "ALL" || ticket.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [tickets, searchQuery, activeFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch('/api/admin/support', {
      method: 'PATCH',
      body: JSON.stringify({ id, status: newStatus }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      showAlert(`Ticket marked as ${newStatus}`, "success");
      fetchTickets();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-brandRed" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-48 pb-20 px-6 selection:bg-brandRed/30">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-6">
            <Link href="/admin" className="text-zinc-600 hover:text-white uppercase font-black text-[10px] tracking-[0.4em] flex items-center gap-2 transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1" /> Return to Hub
            </Link>
            <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.8]">
              Support <br />
              <span className="text-brandRed">Terminal.</span>
            </h1>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* STATUS FILTERS */}
            <div className="flex bg-zinc-950 border border-white/5 p-1 rounded-2xl">
              {["ALL", "OPEN", "RESOLVED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${
                    activeFilter === status 
                    ? 'bg-brandRed text-white shadow-lg' 
                    : 'text-zinc-600 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative group w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-brandRed transition-colors" size={14} />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="SEARCH TICKET..." 
                className="w-full bg-zinc-950 border border-white/5 p-3 pl-11 rounded-full text-[10px] font-bold uppercase tracking-widest focus:border-brandRed outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket: any) => (
              <div key={ticket._id} className="bg-zinc-950 border border-white/5 p-10 rounded-[40px] relative group hover:border-brandRed/30 transition-all duration-500 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] border ${ticket.status === 'OPEN' ? 'border-brandRed text-brandRed bg-brandRed/5' : 'border-green-500 text-green-500 bg-green-500/5'}`}>
                    {ticket.status}
                  </div>
                  <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Node ID: {ticket._id.slice(-6)}</span>
                </div>

                <div className="space-y-4 mb-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-brandRed transition-colors">
                    {ticket.subject}
                  </h3>
                  <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white">{ticket.name}</span>
                    <span className="text-zinc-800">//</span>
                    <span>{ticket.email}</span>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-3xl italic text-zinc-400 text-sm leading-relaxed relative">
                  <MessageSquare className="absolute -top-3 -left-3 text-brandRed/20" size={24} />
                  "{ticket.message}"
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex gap-4">
                  <a 
                    href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`}
                    className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-brandRed hover:text-white transition-all"
                  >
                    <Mail size={16} /> Respond
                  </a>
                  {ticket.status === 'OPEN' ? (
                    <button 
                      onClick={() => updateStatus(ticket._id, 'RESOLVED')}
                      className="px-6 bg-zinc-900 border border-white/5 rounded-2xl hover:text-green-500 transition-colors"
                      title="Mark Resolved"
                    >
                      <CheckCircle size={20} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateStatus(ticket._id, 'OPEN')}
                      className="px-6 bg-zinc-900 border border-white/5 rounded-2xl hover:text-brandRed transition-colors"
                      title="Reopen Ticket"
                    >
                      <RefreshCcw size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[50px]">
              <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={60} />
              <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">
                {searchQuery || activeFilter !== "ALL" 
                  ? "No matching nodes found in this sector" 
                  : "Terminal Clear // No Active Queries"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}