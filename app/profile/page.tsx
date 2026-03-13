"use client";
import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Lock, Camera, Check, AlertCircle, 
  Loader2, Shield, Trash2, MapPin, Phone, Briefcase, Calendar, AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // FORM STATES
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // DELETE STATES
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const PUNE_AREAS = [
    "Pune", "Shivajinagar", "Kothrud", "Karve Nagar", "Erandwane", "Deccan", 
    "Sadashiv Peth", "Swargate", "Bibwewadi", "Dhankawadi", "Sahakar Nagar", 
    "Parvati", "Camp", "Koregaon Park", "Mundhwa", "Hadapsar", "Magarpatta", 
    "Wanowrie", "Fatima Nagar", "Kondhwa", "NIBM", "Undri", "Katraj", 
    "Sinhagad Road", "Warje", "Baner", "Balewadi", "Aundh", "Pashan", 
    "Sus", "Bavdhan", "Model Colony", "Viman Nagar", "Yerwada", 
    "Kalyani Nagar", "Lohegaon", "Dhanori", "Vishrantwadi", "Khadki", 
    "Ghorpadi", "Pimpri", "Chinchwad", "Akurdi", "Nigdi", "Bhosari", 
    "Wakad", "Hinjewadi", "Ravet", "Pimple Saudagar", "Pimple Gurav", 
    "Pimple Nilakh", "Kalewadi", "Thergaon", "Rahatani", "Moshi", 
    "Chikhali", "Talawade", "Punawale", "Tathawade", "Dapodi", 
    "Sangvi", "Kasarwadi", "Phugewadi"
  ].sort();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      const meta = user.user_metadata;
      setFullName(meta?.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone?.replace('+91', '') || '');
      setProfession(meta?.profession || '');
      setLocation(meta?.location || '');
      setDob(meta?.dob || '');
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setMessage({ type: '', text: '' });
    const isEmailChanged = email !== user.email;

    const { error } = await supabase.auth.updateUser({
      email: isEmailChanged ? email : undefined,
      data: {
        full_name: fullName.toUpperCase(),
        profession: profession.toUpperCase(),
        location: location,
        dob: dob,
      }
    });

    if (error) {
      setMessage({ type: 'error', text: error.message.toUpperCase() });
    } else {
      if (isEmailChanged) {
        setMessage({ type: 'success', text: 'EMAIL UPDATED. VERIFY NEW EMAIL & LOGIN AGAIN.' });
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push('/auth/login');
        }, 3000);
      } else {
        setMessage({ type: 'success', text: 'TRIBE RECORDS UPDATED!' });
      }
    }
    setUpdating(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const oldUrl = user?.user_metadata?.avatar_url;
      if (oldUrl && oldUrl.includes('/avatars/')) {
        const oldPath = oldUrl.split('/avatars/')[1].split('?')[0]; 
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
      }

      const file = event.target.files[0];
      const filePath = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, avatar_url: publicUrl }
      }));
      setMessage({ type: 'success', text: 'PORTRAIT UPDATED!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    try {
      setUploading(true);
      const url = user?.user_metadata?.avatar_url;
      if (url && url.includes('/avatars/')) {
        const path = url.split('/avatars/')[1].split('?')[0];
        if (path) await supabase.storage.from('avatars').remove([path]);
      }
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      setUser((prev: any) => ({...prev, user_metadata: { ...prev.user_metadata, avatar_url: null }}));
      setMessage({ type: 'success', text: 'PORTRAIT REMOVED.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmPassword) return;
    setIsPurging(true);
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: confirmPassword
    });

    if (authError) {
      setMessage({ type: 'error', text: 'INVALID PASSWORD. PURGE DENIED.' });
      setIsPurging(false);
      return;
    }

    try {
      const url = user?.user_metadata?.avatar_url;
      if (url && url.includes('/avatars/')) {
        const path = url.split('/avatars/')[1].split('?')[0];
        await supabase.storage.from('avatars').remove([path]);
      }

      const res = await fetch(`/api/profile/delete?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        await supabase.auth.signOut();
        router.push('/farewell');
      } else {
        setMessage({ type: 'error', text: 'DATABASE PURGE FAILED.' });
        setIsPurging(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'SYSTEM ERROR DURING PURGE.' });
      setIsPurging(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-brandRed mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Syncing Records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-32 px-6 relative overflow-hidden">
      
      {/* 40% OPACITY BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Image src="/events/signup.jpg" alt="BG" fill className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-zinc-950 border border-white/10 p-10 rounded-[40px] max-w-md w-full shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600" />
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 mx-auto">
              <AlertTriangle size={30} />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-center mb-2">Nuclear <span className="text-red-500">Option</span></h3>
            <p className="text-zinc-500 text-[10px] text-center font-bold uppercase tracking-widest mb-8 leading-relaxed">
              Confirm your tribe password to permanently wipe your records.
            </p>
            
            <input 
              type="password" 
              placeholder="CURRENT PASSWORD"
              className="w-full bg-black border border-white/10 p-5 rounded-2xl text-sm font-bold focus:border-red-500 outline-none transition-all mb-4 text-center placeholder:text-zinc-700"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="space-y-3">
              <button 
                onClick={handleDeleteAccount} 
                disabled={!confirmPassword || isPurging}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPurging ? <Loader2 className="animate-spin" size={14} /> : 'Confirm Purge'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 bg-zinc-900 text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* PROFILE HEADER CARD */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-12 bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[50px] border border-white/10 relative group">
          <div className="relative">
            <div className="w-36 h-36 rounded-full bg-zinc-900 border-2 border-brandRed/30 overflow-hidden flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              {uploading ? <Loader2 className="animate-spin text-brandRed" size={32} /> : 
               user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : 
               <User size={60} className="text-zinc-800" />}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <label className="bg-brandRed p-3 rounded-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-black shadow-2xl">
                <Camera size={18} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
              </label>
              {user?.user_metadata?.avatar_url && (
                <button onClick={deleteAvatar} className="bg-zinc-900 p-3 rounded-2xl hover:text-brandRed transition-all border-4 border-black text-zinc-500 shadow-2xl">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">{fullName || "TRIBE MEMBER"}</h1>
            <p className="text-brandRed font-black uppercase tracking-[0.3em] text-[10px] opacity-80">{user?.email}</p>
          </div>
        </div>

        {/* MESSAGES */}
        {message.text && (
          <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest border animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brandRed/10 text-brandRed border-brandRed/20'}`}>
            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* SETTINGS FORM */}
        <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[50px] border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-brandRed" /> Update Identity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl font-bold outline-none focus:border-brandRed transition-all uppercase text-sm text-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl font-bold outline-none focus:border-brandRed transition-all text-sm text-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Phone (Locked)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={14} />
                <input type="text" disabled value={phone} className="w-full bg-zinc-900/30 border border-white/5 p-5 pl-11 rounded-2xl font-bold text-sm text-zinc-600 cursor-not-allowed" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Profession</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 pl-11 rounded-2xl font-bold outline-none focus:border-brandRed transition-all text-sm uppercase text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Tribe Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <select 
                  className="w-full bg-black/40 border border-white/10 p-5 pl-11 rounded-2xl font-bold text-sm outline-none focus:border-brandRed transition-all text-white appearance-none cursor-pointer"
                  value={location} onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="" disabled className="bg-zinc-900">SELECT AREA</option>
                  {PUNE_AREAS.map(area => (
                    <option key={area} value={area} className="bg-zinc-900">{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Birth Date</label>
              <div className="relative bg-black/40 border border-white/10 p-5 rounded-2xl flex items-center gap-3 cursor-pointer group" onClick={() => dateInputRef.current?.showPicker()}>
                <Calendar size={14} className="text-brandRed group-hover:scale-110 transition-transform" />
                <span className={`font-bold text-sm ${dob ? "text-white" : "text-zinc-600"}`}>{dob || "DD-MM-YYYY"}</span>
                <input ref={dateInputRef} type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
          </div>

          <button onClick={handleUpdateProfile} disabled={updating} className="w-full mt-12 py-6 bg-brandRed text-white font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-white hover:text-black transition-all shadow-xl active:scale-[0.98] text-[12px] disabled:opacity-50">
            {updating ? 'SYNCING DATA...' : 'Update Profile'}
          </button>
        </div>

        {/* SECURITY & DELETE */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[40px] border border-white/10 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Shield size={16} className="text-brandRed" /> Security Vault
              </h3>
              <input type="password" placeholder="NEW PASSWORD" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl font-bold mb-4 outline-none focus:border-brandRed text-white" />
              <button onClick={async () => {
                if(!newPassword) return;
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) setMessage({ type: 'error', text: error.message.toUpperCase() });
                else { setMessage({ type: 'success', text: 'PASSWORD UPDATED!' }); setNewPassword(''); }
              }} className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-black transition-all active:scale-95">Update Access</button>
           </div>
           
           <div className="bg-red-500/5 backdrop-blur-3xl p-10 rounded-[40px] border border-red-500/10 flex flex-col justify-center text-center group">
              <h3 className="text-red-900 font-black uppercase text-[10px] tracking-[0.5em] mb-4">Danger Zone</h3>
              <p className="text-[9px] text-red-900/50 font-bold uppercase mb-6 italic">This will remove your soul from the tribe cloud permanently.</p>
              <button onClick={() => setShowDeleteModal(true)} className="w-full py-5 border border-red-900/20 text-red-900 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                Delete Identity
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}