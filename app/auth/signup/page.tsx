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
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
// --- DUAL TESTING TOGGLES ---
const DEV_MODE_PHONE = false; // Set to true to bypass WhatsApp OTP UI
const DEV_MODE_EMAIL = false; // Set to true to bypass Email Activation message
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
  const [generatedOtp, setGeneratedOtp] = useState(''); 
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const setupRecaptcha = (phoneNumber: string) => {
  const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  return verifier;
};
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

  // Auto-verify phone state if DEV_MODE_PHONE is active
  useEffect(() => {
    if (DEV_MODE_PHONE) {
      setIsPhoneVerified(true);
    }
  }, []);

  const sendPhoneOtp = async () => {
  if (!isPhoneValid || timer > 0) return;
  
  // IF DEV MODE: Just skip the SMS and show the field
  if (DEV_MODE_PHONE) {
    setGeneratedOtp("123456");
    setShowOtpField(true);
    setTimer(60);
    setMessage("DEV MODE: USE CODE 123456");
    return;
  }

  setLoading(true);
  try {
    // 1. Initialize Invisible Recaptcha
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });

    // 2. Send SMS via Firebase
    const phoneNumber = `+91${phone}`;
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    setConfirmationResult(confirmation);
    setShowOtpField(true);
    setTimer(60);
    setMessage("SMS SENT! CHECK YOUR PHONE.");
  } catch (error: any) {
    console.error("Firebase Auth Error:", error);
    setMessage("ERROR: " + (error.code === 'auth/too-many-requests' ? "TOO MANY ATTEMPTS. TRY LATER." : "FAILED TO SEND SMS."));
    // Reset recaptcha if it fails
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
    }
  }
  setLoading(false);
};

  const verifyPhoneOtp = async () => {
  setLoading(true);
  
  // IF DEV MODE: Check against hardcoded string
  if (DEV_MODE_PHONE) {
    if (otp === "123456") {
      setIsPhoneVerified(true);
      setShowOtpField(false);
      setMessage("PHONE VERIFIED (DEV MODE)");
    } else {
      setMessage("INVALID DEV CODE.");
    }
    setLoading(false);
    return;
  }

  // REAL MODE: Verify with Firebase
  try {
    if (!confirmationResult) {
      setMessage("SESSION EXPIRED. RESEND OTP.");
      setLoading(false);
      return;
    }

    await confirmationResult.confirm(otp);
    setIsPhoneVerified(true);
    setShowOtpField(false);
    setMessage("PHONE VERIFIED SUCCESSFULLY");
  } catch (error) {
    console.error("Verification Error:", error);
    setMessage("INVALID OTP. PLEASE CHECK AGAIN.");
  }
  setLoading(false);
};

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!isPhoneVerified && !DEV_MODE_PHONE) {
    setMessage("PLEASE VERIFY YOUR PHONE NUMBER FIRST.");
    return;
  }

  if (dob && !isAdult) {
    setMessage("MEMBERSHIP DENIED: YOU MUST BE 16+ TO JOIN.");
    return;
  }

  setLoading(true);
  setMessage('');

  try {
    // 1. UPDATED DUPLICATE CHECK: Reference 'phone_number' column
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles') 
      .select('phone_number')
      .eq('phone_number', `+91${phone}`)
      .maybeSingle(); // Returns null if no user found, instead of throwing an error

    if (existingUser) {
      setMessage("PHONE NUMBER ALREADY REGISTERED. PLEASE SIGN IN.");
      setLoading(false);
      return;
    }

    // 2. TRIGGER SUPABASE SIGNUP
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          first_name: firstName.toUpperCase().trim(),
          last_name: lastName.toUpperCase().trim(),
          full_name: `${firstName} ${lastName}`.toUpperCase().trim(),
          profession: profession.toUpperCase().trim(),
          location: location,
          dob: dob,
          phone: `+91${phone}`, // This key is what the SQL Trigger reads
        },
      },
    });

    if (signupError) {
      console.error("Signup Auth Error:", signupError);
      setMessage(signupError.message.toUpperCase());
      setLoading(false);
      return;
    }

    // 3. SUCCESS REDIRECT
    if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
        setMessage("EMAIL ALREADY EXISTS. PLEASE SIGN IN.");
        setLoading(false);
        return;
      }

      if (DEV_MODE_EMAIL) {
        setMessage('REGISTRATION SUCCESSFUL! ENTERING...');
        setTimeout(() => router.push('/auth/login'), 2500);
      } else {
        setMessage('CHECK YOUR EMAIL TO ACTIVATE YOUR TRIBE ACCOUNT!');
      }
    }
  } catch (err) {
    console.error("Process Error:", err);
    setMessage("PROCESS FAILED. CHECK CONSOLE.");
  } finally {
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
                    type="tel" placeholder="PHONE NUMBER" required maxLength={10} 
                    disabled={isPhoneVerified && !DEV_MODE_PHONE}
                    className={`w-full bg-black/40 border p-4 pl-11 rounded-xl font-bold text-[11px] tracking-widest focus:border-brandRed transition-all outline-none text-white ${showPhoneError ? 'border-brandRed/50' : 'border-white/10'} ${isPhoneVerified && !DEV_MODE_PHONE ? 'opacity-50 cursor-not-allowed' : ''} ${!DEV_MODE_PHONE ? 'pr-24' : 'pr-11'}`}
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                  {!DEV_MODE_PHONE && !isPhoneVerified && isPhoneValid && (
                    <button 
                      type="button" 
                      onClick={sendPhoneOtp}
                      disabled={timer > 0}
                      className="absolute right-2 px-4 py-2 bg-brandRed text-white text-[9px] font-black rounded-lg hover:bg-white hover:text-black transition-all disabled:opacity-50"
                    >
                      {timer > 0 ? `WAIT ${timer}s` : "VERIFY"}
                    </button>
                  )}
                  {(isPhoneVerified || DEV_MODE_PHONE) && phone.length === 10 && (
                    <CheckCircle2 className="absolute right-4 text-green-500" size={18} />
                  )}
                </div>
                {showPhoneError && (
                  <p className="text-[8px] font-black uppercase text-brandRed tracking-widest ml-4 animate-pulse">
                    Invalid Number: 10 Digits Required
                  </p>
                )}

                <AnimatePresence>
                  {!DEV_MODE_PHONE && showOtpField && !isPhoneVerified && (
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
                <input suppressHydrationWarning
                  type="email" placeholder="EMAIL" required
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

              <button 
                disabled={Boolean(loading || (dob && !isAdult) || (!isPhoneVerified && !DEV_MODE_PHONE))} 
                className={`w-full py-4 text-white font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl active:scale-95 text-[12px] flex items-center justify-center gap-2 mt-4 ${
                  (loading || (dob && !isAdult) || (!isPhoneVerified && !DEV_MODE_PHONE)) ? "bg-zinc-800 cursor-not-allowed opacity-50" : "bg-brandRed hover:bg-white hover:text-black"
                }`}
              >
                {loading ? 'Processing...' : 'Tap to Register'} <ArrowRight size={14} />
              </button>
            </form>
                <div id="recaptcha-container"></div>
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