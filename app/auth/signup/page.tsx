"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Mail, Lock, User, ArrowRight, Eye, EyeOff, 
  Phone, Smartphone, RefreshCcw, Briefcase, 
  MapPin, Calendar as CalendarIcon, CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TribeCalendar from '@/components/ui/TribeCalendar';
// --- DUAL TESTING TOGGLES ---
const DEV_MODE_PHONE = true; // Set to false for real SMS OTP
const DEV_MODE_EMAIL = true; // Set to false to force Email Activation link
// ----------------------------

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(DEV_MODE_PHONE); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const dateContainerRef = useRef<HTMLDivElement>(null);
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

  const isPhoneValid = useMemo(() => phone.length === 10, [phone]);
  const showPhoneError = useMemo(() => phone.length > 0 && phone.length < 10, [phone]);

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
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 16;
  }, [dob]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendPhoneOtp = async () => {
    if (!isPhoneValid || timer > 0) return;
    
    if (DEV_MODE_PHONE) {
      setShowOtpField(true);
      setMessage("DEV MODE: ENTER ANY 6 DIGITS TO VERIFY");
      setTimer(30);
      return;
    }

    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    
    if (error) {
      setMessage(error.message.toUpperCase());
    } else {
      setShowOtpField(true);
      setTimer(60);
      setMessage("OTP SENT TO YOUR MOBILE");
    }
    setLoading(false);
  };

  const verifyPhoneOtp = async () => {
    if (DEV_MODE_PHONE) {
      setIsPhoneVerified(true);
      setShowOtpField(false);
      setMessage("PHONE VERIFIED (BYPASSED)");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ 
      phone: `+91${phone}`, 
      token: otp, 
      type: 'sms' 
    });

    if (error) {
      setMessage("INVALID OTP. PLEASE CHECK AND TRY AGAIN.");
    } else {
      setIsPhoneVerified(true);
      setShowOtpField(false);
      setMessage("PHONE VERIFIED SUCCESSFULLY");
    }
    setLoading(false);
  };

 const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneVerified) {
      setMessage("PLEASE VERIFY YOUR PHONE NUMBER FIRST.");
      return;
    }

    if (dob && !isAdult) {
      setMessage("MEMBERSHIP DENIED: YOU MUST BE 16+ TO JOIN.");
      return;
    }

    setLoading(true);
    setMessage('');

    // Destructure 'data' along with 'error' to check identities
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone: `+91${phone}`,
      options: {
        data: { 
          first_name: firstName.toUpperCase(),
          last_name: lastName.toUpperCase(),
          full_name: `${firstName} ${lastName}`.toUpperCase(),
          profession: profession.toUpperCase(),
          location: location,
          dob: dob,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("16") || error.message.toLowerCase().includes("denied")) {
        setMessage("MEMBERSHIP DENIED: AGE MUST BE 16 OR OLDER.");
      } else {
        setMessage(error.message.toUpperCase());
      }
      setLoading(false);
    } else {
      // --- DUPLICATE ACCOUNT CHECK ---
      // If Supabase returns a user but the identities array is empty, 
      // it means the email or phone is already registered.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage("ACCOUNT ALREADY EXISTS. PLEASE SIGN IN INSTEAD.");
        setLoading(false);
        return;
      }

      if (DEV_MODE_EMAIL) {
        setMessage('REGISTRATION SUCCESSFUL! ENTERING...');
        setTimeout(() => router.push('/auth/login'), 2500);
      } else {
        setMessage('CHECK YOUR EMAIL TO ACTIVATE YOUR TRIBE ACCOUNT!');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 pt-32 pb-12 relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <Image 
          src="/events/signup.jpg" 
          alt="Background" 
          fill 
          className="object-cover object-right opacity-60" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent hidden lg:block" />
        <div className="absolute inset-0 bg-black/60 lg:hidden" />
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 px-8 py-10 md:px-10 md:py-12 rounded-[45px] shadow-2xl overflow-hidden text-left">
          
          <div className="flex justify-center mb-8 relative z-10">
            <Link href="/">
             <Image 
  src="/logo.png" 
  alt="Logo" 
  width={500} 
  height={150} 
  // Optimized for mobile width while maintaining desktop sharpness
  sizes="(max-width: 768px) 250px, 500px"
  className="h-24 md:h-32 w-auto object-contain drop-shadow-[0_0_25px_rgba(255,0,0,0.5)]" 
  priority 
/>
            </Link>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Join the <span className="text-brandRed">Tribe.</span>
              </h2>
              {(DEV_MODE_PHONE || DEV_MODE_EMAIL) && (
                <span className="text-[7px] font-black tracking-[0.5em] text-brandRed block mt-2 animate-pulse uppercase">
                  {/* [ Dev Testing Active ] */}
                </span>
              )}
            </div>

            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" placeholder="FIRST NAME" required
                  className="bg-black/40 border border-white/10 p-4 rounded-xl font-bold text-[10px] tracking-widest focus:border-brandRed transition-all outline-none text-white uppercase"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                />
                <input 
                  type="text" placeholder="LAST NAME" required
                  className="bg-black/40 border border-white/10 p-4 rounded-xl font-bold text-[10px] tracking-widest focus:border-brandRed transition-all outline-none text-white uppercase"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
  <input 
    type="text" 
    placeholder="PROFESSION" 
    required
    
    className="w-full bg-black/40 border border-white/10 p-4 pl-11 rounded-xl font-bold text-[10px] tracking-widest focus:border-brandRed transition-all outline-none text-white uppercase"
    value={profession} 
    
    onChange={(e) => setProfession(e.target.value.toUpperCase())}
  />
</div>
                
                <div className="relative" ref={dateContainerRef}>
  <div 
    className="relative group cursor-pointer bg-black/40 border border-white/10 p-4 rounded-xl flex items-center gap-3 focus-within:border-brandRed transition-all"
    onClick={() => setShowCalendar(!showCalendar)}
  >
    <CalendarIcon size={14} className={dob ? "text-brandRed" : "text-white/20"} />
    <span className={`font-bold text-[9px] tracking-widest uppercase truncate ${dob ? "text-white" : "text-zinc-500"}`}>
      {dob ? new Date(dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "BIRTH DATE"}
    </span>
  </div>

  <AnimatePresence>
    {showCalendar && (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowCalendar(false)} />
        <TribeCalendar 
          value={dob} 
          onChange={(date) => setDob(date)} 
          onClose={() => setShowCalendar(false)} 
          maxDate={maxDobDate}
          // Pass the position of the input field
          anchorRef={dateContainerRef}
        />
      </>
    )}
  </AnimatePresence>
</div>
              </div>

              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <select 
                  required
                  className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl font-bold text-[11px] tracking-widest focus:border-brandRed transition-all outline-none text-white appearance-none cursor-pointer"
                  value={location} onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="" disabled className="bg-zinc-900">SELECT AREA</option>
                  {PUNE_AREAS.map(area => (
                    <option key={area} value={area} className="bg-zinc-900">{area}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="relative flex items-center group">
                  <Phone className="absolute left-4 text-white/20" size={14} />
                  <input 
                    type="tel" placeholder="PHONE NUMBER" required maxLength={10} disabled={isPhoneVerified && !DEV_MODE_PHONE}
                    className={`w-full bg-black/40 border p-4 pl-11 pr-24 rounded-xl font-bold text-[11px] tracking-widest focus:border-brandRed transition-all outline-none text-white ${showPhoneError ? 'border-brandRed/50' : 'border-white/10'}`}
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                  {!isPhoneVerified && isPhoneValid && (
                    <button 
                      type="button" 
                      onClick={sendPhoneOtp}
                      disabled={timer > 0}
                      className="absolute right-2 px-4 py-2 bg-brandRed text-white text-[9px] font-black rounded-lg hover:bg-white hover:text-black transition-all disabled:opacity-50"
                    >
                      {timer > 0 ? `WAIT ${timer}s` : "VERIFY"}
                    </button>
                  )}
                  {isPhoneVerified && <CheckCircle2 className="absolute right-4 text-green-500" size={18} />}
                </div>
                {showPhoneError && (
                  <p className="text-[8px] font-black uppercase text-brandRed tracking-widest ml-4 animate-pulse">
                    Invalid Number: 10 Digits Required
                  </p>
                )}

                <AnimatePresence>
                  {showOtpField && !isPhoneVerified && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="relative flex items-center mt-2 overflow-hidden"
                    >
                      <Smartphone className="absolute left-4 text-brandRed" size={14} />
                      <input 
                        type="text" placeholder="ENTER 6-DIGIT OTP" maxLength={6}
                        className="w-full bg-brandRed/10 border border-brandRed/30 p-4 pl-11 pr-24 rounded-xl font-black text-[11px] tracking-[0.3em] outline-none text-white"
                        value={otp} onChange={(e) => setOtp(e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={verifyPhoneOtp}
                        className="absolute right-2 px-4 py-2 bg-white text-black text-[9px] font-black rounded-lg transition-all"
                      >
                        SUBMIT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  type="email" placeholder="EMAIL" required
                  suppressHydrationWarning
                  className="w-full bg-black/40 border border-white/10 p-4 pl-11 rounded-xl font-bold text-[11px] tracking-widest focus:border-brandRed transition-all outline-none text-white"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  type={showPassword ? "text" : "password"} placeholder="PASSWORD" required
                  className="w-full bg-black/40 border border-white/10 p-4 pl-11 pr-11 rounded-xl font-bold text-[11px] tracking-widest focus:border-brandRed transition-all outline-none text-white"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-brandRed transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {message && (
                <p className={`text-[9px] font-black uppercase text-center py-2 px-4 rounded-lg bg-black/50 border ${message.includes('SUCCESSFUL') || message.includes('VERIFIED') ? 'text-green-500 border-green-500/20' : 'text-brandRed border-brandRed/20'}`}>
                  {message}
                </p>
              )}

              {!isAdult && dob && (
                <div className="flex flex-col items-center gap-1 animate-pulse">
                  <p className="text-[8px] font-black uppercase text-center text-brandRed tracking-widest">
                    Restricted: Age must be 16+
                  </p>
                  <div className="h-[1px] w-12 bg-brandRed/30" />
                </div>
              )}

              <button 
                disabled={Boolean(loading || (dob && !isAdult) || !isPhoneVerified)} 
                className={`w-full py-4 text-white font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl active:scale-95 text-[12px] flex items-center justify-center gap-2 mt-4 ${
                  (loading || (dob && !isAdult) || !isPhoneVerified) ? "bg-zinc-800 cursor-not-allowed opacity-50" : "bg-brandRed hover:bg-white hover:text-black"
                }`}
              >
                {loading ? 'Processing...' : 'Tap to Register'} <ArrowRight size={14} />
              </button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-3">
              <Link href="/auth/login" className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-brandRed transition-colors">
                Already a member? <span className="text-white">Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}