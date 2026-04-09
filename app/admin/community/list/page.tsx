"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ArrowRight, Loader2, ArrowLeft, 
  Image as ImageIcon, MapPin, Plus, Trash2, X, 
  Link as LinkIcon, Phone, Globe, Briefcase, Camera, Check, Clock, Instagram
} from 'lucide-react';
import TribeTimePicker from '@/components/ui/TribeTimePicker';
import TribeAlert from '@/components/TribeAlert'; 

interface GalleryItem {
  id: string;
  type: 'existing' | 'new';
  previewUrl: string;
  file?: File;
}

const INTERNAL_CATEGORIES = ["JAMMING", "SPORTS", "ARTS", "TECH", "COMMUNITY", "OTHER"];
const EXTERNAL_CATEGORIES = ["SAMAJAM", "TEMPLE", "CHURCH", "ORGANIZATION", "OTHER"];

export default function ListOrganization() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]); 
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isVisible: false, message: '', type: 'info' });

  const triggerAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isVisible: true, message, type });
  };

  const [pickerField, setPickerField] = useState<'openTime' | 'closeTime' | null>(null);
  const openTimeRef = useRef<HTMLDivElement>(null);
  const closeTimeRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '', category: 'COMMUNITY', customCategory: '', area: '', tagline: '',
    description: '', link: '', instagram: '', image: '', mapUrl: '', contact: '', website: '',
    openTime: '09:00 AM', closeTime: '06:00 PM'
  });

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    if (editId) {
      fetch(`/api/community?admin=true`).then(res => res.json()).then(data => {
        const item = Array.isArray(data) ? data.find((i: any) => i._id === editId) : null;
        if (item) {
          const allStandard = [...INTERNAL_CATEGORIES, ...EXTERNAL_CATEGORIES.filter(c => c !== "OTHER")];
          const isCustom = !allStandard.includes(item.category?.toUpperCase());
          setFormData({
            title: item.title || '',
            category: isCustom ? "OTHER" : (item.category || 'COMMUNITY'),
            customCategory: isCustom ? item.category : '',
            area: item.area || '',
            tagline: item.tagline || '',
            description: item.description || '',
            link: item.link || '',
            instagram: item.instagram || '',
            image: item.image || '',
            mapUrl: item.mapUrl || '',
            contact: item.contact || '',
            website: item.website || '',
            openTime: item.openTime || '09:00 AM',
            closeTime: item.closeTime || '06:00 PM'
          });
          setShowCustomCategory(isCustom);
          setServices(item.services || []);
          const paths = item.imagePaths || (item.image ? [item.image] : []);
          const existingGallery: GalleryItem[] = paths.map((p: string) => ({ id: p, type: 'existing', previewUrl: p }));
          setGallery(existingGallery);
          if (existingGallery.length > 0) {
            const thumbIdx = existingGallery.findIndex((g: GalleryItem) => g.previewUrl === item.image);
            setThumbnailId(thumbIdx !== -1 ? existingGallery[thumbIdx].id : existingGallery[0].id);
          }
        }
      });
    }
  }, [editId]);

  const updateService = (index: number, field: string, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (gallery.length + selected.length > 7) return triggerAlert("Maximum 7 images permitted", "error");
      const newImgs: GalleryItem[] = selected.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        type: 'new', file, previewUrl: URL.createObjectURL(file)
      }));
      setGallery([...gallery, ...newImgs]);
      if (!thumbnailId && newImgs.length > 0) setThumbnailId(newImgs[0].id);
    }
  };

  const handleRemoveImage = (id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id));
    if (thumbnailId === id) setThumbnailId(null);
  };

  const validateURL = (url: string) => {
    if (!url) return true;
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url);
  };

  const handleSubmit = async () => {
    // Basic Mandatory Validations
    if (gallery.length === 0) return triggerAlert("Gallery cannot be empty", "error");
    if (!thumbnailId) return triggerAlert("Please select a thumbnail", "error");
    if (!formData.title || !formData.area) return triggerAlert("Name and Area are mandatory", "error");

    // Digital Channel Validations
    if (formData.contact && formData.contact.length !== 10) {
      return triggerAlert("WhatsApp Number must be 10 digits", "error");
    }
    if (formData.website && !validateURL(formData.website)) {
      return triggerAlert("Please enter a valid Website URL", "error");
    }
    if (formData.link && !validateURL(formData.link)) {
      return triggerAlert("Please enter a valid Group Link", "error");
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get admin name from metadata, fallback to email prefix if name isn't set
      const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Tribe Moderator";

      let finalThumbnailUrl = formData.image;
      const finalPaths = await Promise.all(gallery.map(async (img: GalleryItem) => {
        if (img.type === 'new' && img.file) {
          const fileName = `admin-node-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
          const { data, error } = await supabase.storage.from('community').upload(fileName, img.file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('community').getPublicUrl(data.path);
          if (img.id === thumbnailId) finalThumbnailUrl = urlData.publicUrl;
          return urlData.publicUrl;
        }
        if (img.id === thumbnailId) finalThumbnailUrl = img.previewUrl;
        return img.previewUrl;
      }));

      // Cleanup Instagram (ensure @ is handled based on your backend preference)
      let igHandle = formData.instagram.trim();
      if (igHandle.startsWith('https://')) {
        igHandle = igHandle.split('/').filter(Boolean).pop() || '';
      }
      igHandle = igHandle.replace('@', '');

      const finalCategory = formData.category === "OTHER" ? formData.customCategory : formData.category;
      const res = await fetch('/api/community/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          approvedBy: adminName, // Added admin name for email notifications
          instagram: igHandle,
          category: finalCategory.toUpperCase(), 
          image: finalThumbnailUrl, 
          imagePaths: finalPaths, 
          services, 
          isApproved: true, 
          submittedBy: user?.email, 
          _id: editId 
        })
      });

      if (res.ok) { 
        triggerAlert("Grid Intelligence Synchronized", "success");
        setTimeout(() => router.push('/admin/community'), 2500); 
      }
    } catch (err) { 
      triggerAlert("Sync Transmission Failed", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-40 pb-20 px-6">
      <TribeAlert 
        message={alertConfig.message}
        type={alertConfig.type}
        isVisible={alertConfig.isVisible}
        onClose={() => setAlertConfig(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex gap-2">
          {[1, 2].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-cyan-400 shadow-[0_0_15px_#00FFFF]' : 'bg-zinc-800'}`} />)}
        </div>

        {step === 1 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter text-white">Admin <span className="text-cyan-400">Community Hub .</span></h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Community Name *</label>
                <input placeholder="ENTER TITLE" className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl outline-none focus:border-cyan-400 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Sector Type *</label>
                <select className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl outline-none focus:border-cyan-400 font-bold appearance-none" value={formData.category} 
                  onChange={(e) => { setFormData({...formData, category: e.target.value}); setShowCustomCategory(e.target.value === "OTHER"); }}>
                  <optgroup label="Internal Tribe">{INTERNAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                  <optgroup label="External Ties">{EXTERNAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Area / Sector *</label>
                <input placeholder="E.G. BANER" className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl outline-none focus:border-cyan-400 font-bold" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value.toUpperCase()})} />
              </div>
              
              <div className="space-y-2" ref={openTimeRef}>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 flex items-center gap-2"><Clock size={12}/> Opening time</label>
                <div onClick={() => setPickerField('openTime')} className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl cursor-pointer font-bold flex justify-between items-center hover:border-cyan-400 transition-all">{formData.openTime} <Clock size={16} className="text-zinc-600" /></div>
              </div>
              <div className="space-y-2" ref={closeTimeRef}>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 flex items-center gap-2"><Clock size={12}/> Closing Time</label>
                <div onClick={() => setPickerField('closeTime')} className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl cursor-pointer font-bold flex justify-between items-center hover:border-cyan-400 transition-all">{formData.closeTime} <Clock size={16} className="text-zinc-600" /></div>
              </div>

              <AnimatePresence>
                {pickerField && (
                    <TribeTimePicker value={formData[pickerField]} anchorRef={pickerField === 'openTime' ? openTimeRef : closeTimeRef} onClose={() => setPickerField(null)} onChange={(time) => setFormData({ ...formData, [pickerField]: time })} />
                )}
              </AnimatePresence>

              {showCustomCategory && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-cyan-400 ml-2">Custom Sector Name *</label>
                  <input placeholder="SPECIFY CATEGORY" className="w-full bg-zinc-900 border border-cyan-400/30 p-5 rounded-2xl outline-none focus:border-cyan-400 font-bold" value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value.toUpperCase()})} />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Maps URL</label>
                <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} /><input placeholder="Paste google maps share link" className="w-full bg-zinc-900 border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-cyan-400 font-bold text-xs" value={formData.mapUrl} onChange={e => setFormData({...formData, mapUrl: e.target.value})} /></div>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-3">Proceed to Assets <ArrowRight size={20}/></button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(1)} className="p-4 bg-zinc-900 rounded-xl hover:bg-cyan-400 transition-all"><ArrowLeft /></button>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter">Media <span className="text-cyan-400">& Offerings</span></h1>
            </div>

            <div className="bg-zinc-900/30 p-8 rounded-[40px] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-cyan-400"><Briefcase size={20}/><label className="text-[11px] font-black uppercase tracking-widest text-white">Services / Impact</label></div>
                    <button onClick={() => setServices([...services, { name: '', desc: '' }])} className="text-[10px] bg-white text-black px-4 py-2 rounded-full font-black uppercase hover:bg-cyan-400 transition-all">+ New Service</button>
                </div>
                <div className="space-y-4">
                  {services.map((s, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 relative group">
                      <button onClick={() => setServices(services.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"><X size={12}/></button>
                      <input placeholder="OFFERING NAME" className="bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none focus:border-cyan-400 text-[10px] font-black uppercase text-white" value={s.name} onChange={(e) => updateService(i, 'name', e.target.value)} />
                      <textarea placeholder="OFFERING DESCRIPTION" className="bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none focus:border-cyan-400 text-[10px] font-medium min-h-[60px] text-zinc-400" value={s.desc} onChange={(e) => updateService(i, 'desc', e.target.value)} />
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 p-8 rounded-[40px] border border-white/5 space-y-6">
                <div className="flex items-center gap-3 text-cyan-400"><Camera size={20}/><label className="text-[11px] font-black uppercase tracking-widest text-white">Community Gallery *</label></div>
                <div className="flex gap-6 overflow-x-auto pb-6 pt-4 no-scrollbar overflow-y-visible">
                    {gallery.map((img: GalleryItem) => (
                        <div key={img.id} className="relative flex-shrink-0 group">
                          <button 
                            type="button"
                            onClick={() => setThumbnailId(img.id)} 
                            className={`relative w-32 h-32 rounded-2xl overflow-hidden border-2 transition-all ${
                                thumbnailId === img.id ? 'border-cyan-400 scale-105 shadow-[0_0_15px_#00FFFF66]' : 'border-white/5 opacity-50'
                            }`}
                          >
                              <img src={img.previewUrl} className="w-full h-full object-cover" alt="thumb" />
                              {thumbnailId === img.id && (
                                <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                                    <Check size={20} strokeWidth={4} />
                                </div>
                              )}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-[30] shadow-xl hover:scale-110 active:scale-90 border-2 border-[#030303]"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                    ))}
                    {gallery.length < 7 && (
                      <label className="shrink-0 w-32 h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-all bg-zinc-950/50 group">
                        <Plus size={24} className="text-zinc-700 group-hover:text-cyan-400 transition-colors" /><input type="file" multiple className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                </div>
            </div>

            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Description / About *</label><textarea placeholder="ENTER STORY" className="w-full bg-zinc-900 border border-white/10 p-6 rounded-3xl outline-none focus:border-cyan-400 min-h-[150px] font-medium italic text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>

            <div className="bg-zinc-900/30 p-8 rounded-[40px] border border-white/5 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Broadcasting Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-zinc-600 ml-2">WhatsApp Contact</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} /><input placeholder="10 DIGITS" maxLength={10} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-cyan-400 font-bold text-white" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value.replace(/\D/g,'')})} /></div></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-zinc-600 ml-2">WhatsApp Link</label><div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} /><input placeholder="URL" className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-cyan-400 font-bold text-xs text-white" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} /></div></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-zinc-600 ml-2">Instagram</label><div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} /><input placeholder="@USER" className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-cyan-400 font-bold text-white uppercase" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} /></div></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-zinc-600 ml-2">Website</label><div className="relative"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} /><input placeholder="URL" className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-cyan-400 font-bold text-xs text-white" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div></div>
                </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-8 bg-cyan-400 text-black rounded-3xl font-black uppercase tracking-[0.4em] shadow-xl hover:bg-white transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : editId ? 'Synchronize Node Intelligence' : 'Initialize Community'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}