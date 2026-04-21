"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Lock, Camera, Check, AlertCircle, 
  Loader2, Shield, Trash2, MapPin, Phone, Briefcase, 
  Calendar, AlertTriangle, CheckCircle2, Smartphone
} from 'lucide-react';
import TribeCalendar from '@/components/ui/TribeCalendar';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

// 🔥 FIREBASE IMPORTS FOR OTP
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const DEV_MODE_PHONE = false; 

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // FORM STATES
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // PHONE OTP STATES
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Default true for existing phone
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // DELETE STATES
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  // UI STATES
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  // --- AGE LOGIC ---
  const maxDobDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 16);
    return date.toISOString().split("T")[0];
  }, []);

  const isAdult = useMemo(() => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 16;
  }, [dob]);

  const isPhoneValid = useMemo(() => phone.length === 10, [phone]);

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

  // --- PRE-WARM RECAPTCHA ---
  useEffect(() => {
    // 🔥 FIX: Added !loading check so it waits for the DOM to actually exist
    if (!loading && typeof window !== "undefined" && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
    
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [loading]); // 🔥 FIX: Added loading to the dependency array

  // --- TIMER EFFECT ---
  useEffect(() => {
    let interval: any;
    if (timer > 0) interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

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
      setOriginalEmail(user.email || '');
      
      const rawPhone = user.phone || meta?.phone || '';
      const formattedPhone = rawPhone.replace('+91', '') || '';
      setPhone(formattedPhone);
      setOriginalPhone(formattedPhone);
      
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

  const handleDateSelect = (date: string) => {
    setDob(date);
    setShowCalendar(false);
  };

  // --- FIREBASE OTP LOGIC ---
  const sendPhoneOtp = async () => {
    if (!isPhoneValid || timer > 0 || otpLoading) return;
    setOtpLoading(true);
    setMessage({ type: 'info', text: "INITIALIZING SECURITY GATEWAY..." }); 
    try {
      if (DEV_MODE_PHONE) {
        await new Promise(res => setTimeout(res, 800));
        setShowOtpField(true);
        setTimer(60);
        setMessage({ type: 'info', text: "DEBUG MODE: USE CODE 123456" });
        setOtpLoading(false);
        return;
      }

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      
      const phoneNumber = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setShowOtpField(true);
      setTimer(60);
      setMessage({ type: 'success', text: "VERIFICATION CODE SENT." });
    } catch (error: any) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      setMessage({ type: 'error', text: "GATEWAY ERROR. PLEASE RETRY." });
      setTimer(0);
    } finally { setOtpLoading(false); }
  };

  const verifyPhoneOtp = async () => {
    if (!otp || otpLoading) return;
    setOtpLoading(true);
    try {
      if (DEV_MODE_PHONE) {
        if (otp === "123456") {
          setIsPhoneVerified(true);
          setShowOtpField(false);
          setMessage({ type: 'success', text: "PHONE VERIFIED SUCCESSFULLY" });
        } else { setMessage({ type: 'error', text: "INVALID CODE." }); }
      } else {
        if (!confirmationResult) throw new Error("Session Expired");
        await confirmationResult.confirm(otp);
        setIsPhoneVerified(true);
        setShowOtpField(false);
        setMessage({ type: 'success', text: "PHONE VERIFIED SUCCESSFULLY" });
      }
    } catch (error) { 
      setMessage({ type: 'error', text: "INVALID OTP. PLEASE CHECK AGAIN." });
    } finally { setOtpLoading(false); }
  };

  // --- PROFILE UPDATE LOGIC ---
  const handleUpdateProfile = async () => {
    if (dob && !isAdult) {
      setMessage({ type: 'error', text: 'UPDATE DENIED: YOU MUST BE 16 OR OLDER.' });
      return;
    }

    if (!isPhoneVerified) {
      setMessage({ type: 'error', text: 'PLEASE VERIFY YOUR NEW PHONE NUMBER.' });
      return;
    }

    setUpdating(true);
    setMessage({ type: '', text: '' });
    const isEmailChanged = email !== originalEmail;
    const isPhoneChanged = phone !== originalPhone;

    // Build metadata payload
    let updatedData: any = {
      full_name: fullName.toUpperCase(),
      profession: profession.toUpperCase(),
      location: location,
      dob: dob,
    };

    // If phone changed, update metadata
    if (isPhoneChanged) {
      updatedData.phone = `+91${phone}`;
    }

    const { error } = await supabase.auth.updateUser({
      email: isEmailChanged ? email : undefined,
      data: updatedData
    });

    if (error) {
      setMessage({ type: 'error', text: error.message.toUpperCase() });
    } else {
      if (isEmailChanged) {
        setMessage({ type: 'success', text: 'UPDATE INITIATED. PLEASE CHECK YOUR NEW EMAIL INBOX FOR A VERIFICATION LINK.' });
      } else {
        setMessage({ type: 'success', text: 'TRIBE RECORDS UPDATED SUCCESSFULLY!' });
        if (isPhoneChanged) setOriginalPhone(phone); // Update local truth
      }
    }
    setUpdating(false);
  };

  // --- AVATAR & ACCOUNT DELETION LOGIC (Unchanged) ---
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
      setUser((prev: any) => ({ ...prev, user_metadata: { ...prev.user_metadata, avatar_url: publicUrl } }));
      setMessage({ type: 'success', text: 'PORTRAIT UPDATED!' });
    } catch (error: any) { setMessage({ type: 'error', text: error.message }); } finally { setUploading(false); }
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
    } catch (error: any) { setMessage({ type: 'error', text: error.message }); } finally { setUploading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirmPassword) return;
    setIsPurging(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: confirmPassword });
    if (authError) {
      setMessage({ type: 'error', text: 'INVALID PASSWORD. PURGE DENIED.' });
      setIsPurging(false); return;
    }
    try {
      const url = user?.user_metadata?.avatar_url;
      if (url && url.includes('/avatars/')) {
        const path = url.split('/avatars/')[1].split('?')[0];
        await supabase.storage.from('avatars').remove([path]);
      }
      const res = await fetch(`/api/profile/delete?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) { await supabase.auth.signOut(); router.push('/farewell'); } 
      else { setMessage({ type: 'error', text: 'DATABASE PURGE FAILED.' }); setIsPurging(false); }
    } catch (err) { setMessage({ type: 'error', text: 'SYSTEM ERROR DURING PURGE.' }); setIsPurging(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-brandRed mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Syncing Records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-32 px-6 relative overflow-hidden">
      
      {/* Hidden Recaptcha for Firebase Auth */}
      <div id="recaptcha-container" className="hidden"></div>
      <style jsx global>{` .grecaptcha-badge { visibility: hidden !important; } `}</style>

      <div className="absolute inset-0 z-0">
        <Image src="/events/signup.jpg" alt="BG" fill className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-black/60" />
      </div>

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

        {message.text && (
          <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest border animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : message.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-brandRed/10 text-brandRed border-brandRed/20'}`}>
            {message.type === 'success' ? <Check size={18} /> : message.type === 'info' ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

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
              {email !== originalEmail && (
                 <p className="text-[8px] font-black uppercase text-amber-500 tracking-widest ml-4 mt-2">
                   Changing email requires inbox verification.
                 </p>
              )}
            </div>

            {/* 🔥 UPDATED PHONE FIELD (Unlocked & Validated) */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Phone Number</label>
              <div className="relative flex items-center group">
                <Phone className="absolute left-4 text-zinc-500" size={14} />
                <input 
                  type="tel" 
                  placeholder="PHONE NUMBER" 
                  maxLength={10} 
                  disabled={otpLoading} 
                  className={`w-full bg-black/40 border p-5 pl-11 rounded-2xl font-bold text-sm outline-none text-white border-white/10 placeholder:text-zinc-500 transition-all ${isPhoneVerified ? 'border-green-500/50 bg-green-500/5' : 'focus:border-brandRed'}`}
                  value={phone} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    if (val === originalPhone) {
                      setIsPhoneVerified(true);
                    } else if (isPhoneVerified) {
                      setIsPhoneVerified(false);
                    }
                    if (showOtpField) setShowOtpField(false);
                    setTimer(0); 
                    setConfirmationResult(null);
                  }}
                />
                {!isPhoneVerified && isPhoneValid && (
                  <button type="button" onClick={sendPhoneOtp} disabled={timer > 0 || otpLoading} className="absolute right-3 px-4 py-2 bg-brandRed text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center gap-2">
                    {otpLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                    {timer > 0 ? `WAIT ${timer}s` : "VERIFY"}
                  </button>
                )}
                {isPhoneVerified && <CheckCircle2 className="absolute right-5 text-green-500" size={18} />}
              </div>

              {/* OTP Field UI */}
              <AnimatePresence>
                {showOtpField && !isPhoneVerified && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative flex items-center mt-2 overflow-hidden">
                    <Smartphone className="absolute left-4 text-brandRed" size={14} />
                    <input type="text" placeholder="ENTER 6-DIGIT OTP" maxLength={6} disabled={otpLoading} className="w-full bg-brandRed/10 border border-brandRed/30 p-5 pl-11 pr-24 rounded-xl font-black text-[12px] tracking-[0.3em] outline-none text-white placeholder:text-zinc-500" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <button type="button" onClick={verifyPhoneOtp} disabled={otpLoading || otp.length < 6} className="absolute right-2 px-4 py-2 bg-white text-black text-[10px] uppercase font-black tracking-widest rounded-lg transition-all hover:bg-zinc-200">
                      {otpLoading ? <Loader2 size={12} className="animate-spin" /> : "SUBMIT"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <div className="relative" ref={dateContainerRef}>
                <div 
                  className={`relative bg-black/40 border p-5 rounded-2xl flex items-center gap-3 cursor-pointer group transition-all ${!isAdult && dob ? 'border-brandRed/50' : 'border-white/10'}`} 
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar size={14} className="text-brandRed group-hover:scale-110 transition-transform" />
                  <span className={`font-bold text-sm ${dob ? "text-white" : "text-zinc-600"}`}>
                    {dob ? new Date(dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "NOT SET"}
                  </span>
                </div>

                <AnimatePresence>
                  {showCalendar && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowCalendar(false)} />
                      <TribeCalendar 
                        value={dob} 
                        onChange={handleDateSelect} 
                        onClose={() => setShowCalendar(false)}
                        anchorRef={dateContainerRef}
                        maxDate={maxDobDate} 
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {!isAdult && dob && (
                <p className="text-[8px] font-black uppercase text-brandRed tracking-widest ml-4 mt-2 animate-pulse">
                  Restriction: Membership requires age 16+
                </p>
              )}
            </div>
          </div>

          <button 
            onClick={handleUpdateProfile} 
            disabled={updating || (!isAdult && dob ? true : false) || !isPhoneVerified}
            className="w-full mt-12 py-6 bg-brandRed text-white font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-white hover:text-black transition-all shadow-xl active:scale-[0.98] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'SYNCING DATA...' : 'Update Profile'}
          </button>
        </div>

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