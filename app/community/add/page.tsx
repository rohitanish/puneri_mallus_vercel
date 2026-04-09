"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  CheckCircle, ArrowRight, Loader2, ArrowLeft, 
  Image as ImageIcon, MapPin, Plus, Trash2, X, 
  Link as LinkIcon, Phone, Globe, Briefcase, Camera, Check, Clock, Instagram
} from 'lucide-react';
import TribeTimePicker from '@/components/ui/TribeTimePicker';
import TribeAlert from '@/components/TribeAlert'; 

const EXTERNAL_CATEGORIES = ["SAMAJAM", "TEMPLE", "CHURCH", "ORGANIZATION", "OTHER"];
const LaserDivider = () => (
  <div className="relative w-full h-px flex items-center justify-center overflow-hidden my-2">
    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brandRed/40 to-transparent" />
    <div className="absolute w-[45%] h-[2px] bg-brandRed shadow-[0_0_25px_#FF0000] z-10" />
    <div className="absolute w-24 h-px bg-white blur-[1.5px] opacity-40 z-20" />
  </div>
);
export default function AddCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [gallery, setGallery] = useState<any[]>([]);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]); 
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // --- TRIBE ALERT STATE ---
  const [alertConfig, setAlertConfig] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isVisible: false, message: '', type: 'info' });

  const triggerAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isVisible: true, message, type });
  };

  // --- TIME PICKER STATE ---
  const [pickerField, setPickerField] = useState<'openTime' | 'closeTime' | null>(null);
  const openTimeRef = useRef<HTMLDivElement>(null);
  const closeTimeRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '', 
    category: 'SAMAJAM', 
    customCategory: '', 
    area: '', 
    tagline: '',
    description: '', 
    link: '', 
    instagram: '', 
    image: '', 
    mapUrl: '', 
    contact: '', 
    website: '',
    openTime: '09:00 AM', 
    closeTime: '06:00 PM'
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addService = () => setServices([...services, { name: '', desc: '' }]);
  const removeService = (index: number) => setServices(services.filter((_, i) => i !== index));
  const updateService = (index: number, field: string, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (gallery.length + selected.length > 5) {
        return triggerAlert("Max 5 images allowed for community review", "error");
      }
      const newImgs = selected.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        type: 'new', 
        file, 
        previewUrl: URL.createObjectURL(file)
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
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(url);
  };

  const handleSubmit = async () => {
    if (gallery.length === 0) return triggerAlert("At least one image is required", "error");
    if (!thumbnailId) return triggerAlert("Please select a thumbnail image", "error");
    if (!formData.title.trim()) return triggerAlert("Organization Name is required", "error");
    if (!formData.area.trim()) return triggerAlert("Location Area is required", "error");
    if (!formData.description.trim()) return triggerAlert("Description is mandatory", "error");
    
    if (!formData.contact || formData.contact.length !== 10) {
      return triggerAlert("Valid 10-digit WhatsApp number required", "error");
    }
    if (formData.website && !validateURL(formData.website)) {
      return triggerAlert("The Website URL format is invalid", "error");
    }
    if (formData.link && !validateURL(formData.link)) {
      return triggerAlert("The Community Link URL format is invalid", "error");
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let finalThumbnailUrl = "";

      const finalPaths = await Promise.all(gallery.map(async (img) => {
        const fileName = `user-node-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        const { data, error } = await supabase.storage.from('community').upload(fileName, img.file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('community').getPublicUrl(data.path);
        
        if (img.id === thumbnailId) finalThumbnailUrl = urlData.publicUrl;
        return urlData.publicUrl;
      }));

      let igHandle = formData.instagram.trim().replace('@', '');
      if (igHandle.startsWith('https://')) {
        igHandle = igHandle.split('/').filter(Boolean).pop() || '';
      }

      const finalCategory = formData.category === "OTHER" ? formData.customCategory : formData.category;
      
      const payload = { 
        ...formData, 
        instagram: igHandle,
        category: finalCategory.toUpperCase(), 
        image: finalThumbnailUrl, 
        imagePaths: finalPaths, 
        services,
        isApproved: false,
        submittedBy: user?.email 
      };

      const res = await fetch('/api/community/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerAlert("Community Submitted for Review", "success");
        setTimeout(() => router.push('/community'), 2500);
      }
    } catch (err) { 
      console.error(err); 
      triggerAlert("Submission failed. Ensure you are logged in.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-40 pb-20 px-6 selection:bg-brandRed/30">
      
      <TribeAlert 
        message={alertConfig.message}
        type={alertConfig.type}
        isVisible={alertConfig.isVisible}
        onClose={() => setAlertConfig(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex gap-2">
          {[1, 2].map(s => (
            <div 
              key={s} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-brandRed shadow-[0_0_10px_#FF0000]' : 'bg-zinc-800'
              }`} 
            />
          ))}
        </div>

        {step === 1 ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <header className="space-y-2">
               <h1 className="text-5xl font-black italic uppercase leading-none">
                 Register <span className="text-brandRed">Circle .</span>
               </h1>
               <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Phase 01: Core Identity</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Organization Name *</label>
                <input 
                  placeholder="E.G. PUNE MALAYALEE ASSOCIATION" 
                  className="w-full bg-transparent outline-none font-bold text-white text-xl" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} 
                />
              </div>

              <div className="space-y-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Sector Type *</label>
                <div className="relative">
                  <select 
                    className="w-full bg-transparent outline-none font-bold text-white cursor-pointer appearance-none" 
                    value={formData.category} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({...formData, category: val});
                      setShowCustomCategory(val === "OTHER");
                    }}
                  >
                    {EXTERNAL_CATEGORIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Area / Location *</label>
                <input 
                  placeholder="E.G. BANER / WAKAD" 
                  className="w-full bg-transparent outline-none font-bold text-white" 
                  value={formData.area} 
                  onChange={e => setFormData({...formData, area: e.target.value.toUpperCase()})} 
                />
              </div>

              <div className="space-y-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all" ref={openTimeRef}>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 flex items-center gap-2">
                  <Clock size={12}/> Opening Time
                </label>
                <div 
                  onClick={() => setPickerField('openTime')}
                  className="cursor-pointer font-bold text-white flex justify-between items-center py-2"
                >
                  {formData.openTime}
                  <Clock size={16} className="text-zinc-600" />
                </div>
              </div>

              <div className="space-y-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all" ref={closeTimeRef}>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 flex items-center gap-2">
                  <Clock size={12}/> Closing Time
                </label>
                <div 
                  onClick={() => setPickerField('closeTime')}
                  className="cursor-pointer font-bold text-white flex justify-between items-center py-2"
                >
                  {formData.closeTime}
                  <Clock size={16} className="text-zinc-600" />
                </div>
              </div>

              <AnimatePresence>
                {pickerField && (
                  <TribeTimePicker 
                    value={formData[pickerField]}
                    anchorRef={pickerField === 'openTime' ? openTimeRef : closeTimeRef}
                    onClose={() => setPickerField(null)}
                    onChange={(time) => setFormData({ ...formData, [pickerField]: time })}
                  />
                )}
              </AnimatePresence>

              {showCustomCategory && (
                <div className="space-y-2 md:col-span-2 border border-brandRed/30 p-6 rounded-[32px]">
                  <label className="text-[10px] font-black uppercase text-brandRed ml-2">Custom Category Name *</label>
                  <input 
                    placeholder="SPECIFY CATEGORY" 
                    className="w-full bg-transparent outline-none font-bold text-white" 
                    value={formData.customCategory} 
                    onChange={e => setFormData({...formData, customCategory: e.target.value.toUpperCase()})} 
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2 border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Google Maps Link</label>
                <div className="relative flex items-center pt-2">
                  <MapPin className="text-zinc-600 mr-3" size={18} />
                  <input 
                    placeholder="PASTE GOOGLE MAPS LINK" 
                    className="w-full bg-transparent outline-none font-bold text-xs text-white" 
                    value={formData.mapUrl} 
                    onChange={e => setFormData({...formData, mapUrl: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            
            {/* CLEAN CENTERED NEXT BUTTON */}
            <div className="pt-6">
              <button 
                onClick={() => setStep(2)} 
                className="group w-full py-8 bg-white text-black rounded-[32px] font-black uppercase tracking-[0.3em] transition-all duration-500 hover:bg-brandRed hover:text-white active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4"
              >
                <span className="text-sm">Next: Offerings & Media</span>
                <ArrowRight 
                  size={20} 
                  strokeWidth={3} 
                  className="transition-transform duration-300 group-hover:translate-x-2" 
                />
              </button>
              
              <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-8 italic">
                Step 01 / 02 • Verification Status: Pending
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setStep(1)} 
                className="p-4 border border-white/25 rounded-2xl hover:bg-brandRed transition-all text-white"
              >
                <ArrowLeft />
              </button>
              <h1 className="text-5xl font-black italic uppercase leading-none">
                Visual <span className="text-brandRed">Identity</span>
              </h1>
            </div>

            {/* SERVICES SECTION */}
            <div className="border border-white/25 p-8 rounded-[40px] space-y-6">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-3 text-brandRed">
                        <Briefcase size={20}/>
                        <label className="text-[11px] font-black uppercase tracking-widest text-white">Offerings / Services</label>
                    </div>
                    <button 
                      onClick={addService} 
                      className="text-[10px] bg-white text-black px-5 py-2 rounded-full font-black uppercase hover:bg-brandRed hover:text-white transition-all"
                    >
                      + Add
                    </button>
                </div>
                <div className="space-y-8">
  {services.map((service, index) => (
    <div key={index} className="relative group space-y-4">
      {/* DELETE BUTTON - Positioned to look integrated but clear */}
      <button 
        onClick={() => removeService(index)} 
        className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90 border-2 border-[#030303]"
      >
        <X size={14} strokeWidth={3} />
      </button>

      {/* INDIVIDUAL BOX FOR SERVICE NAME */}
      <div className="border border-white/25 p-6 rounded-[28px] focus-within:border-brandRed transition-all bg-transparent">
        <label className="text-[9px] font-black uppercase text-zinc-600 ml-2 mb-1 block tracking-widest">
          Service Designation
        </label>
        <input 
          placeholder="E.G. EMERGENCY WELFARE" 
          className="w-full bg-transparent outline-none text-sm font-black uppercase text-white px-2" 
          value={service.name} 
          onChange={(e) => updateService(index, 'name', e.target.value)} 
        />
      </div>

      {/* INDIVIDUAL BOX FOR DESCRIPTION */}
      <div className="border border-white/25 p-6 rounded-[28px] focus-within:border-brandRed transition-all bg-transparent">
        <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 mb-1 block tracking-widest">
          Offer Details
        </label>
        <textarea 
          placeholder="DESCRIBE WHAT THE COMMUNITY PROVIDES..." 
          className="w-full bg-transparent outline-none text-xs font-medium text-zinc-400 italic px-2 resize-none" 
          rows={2}
          value={service.desc} 
          onChange={(e) => updateService(index, 'desc', e.target.value)} 
        />
      </div>
    </div>
  ))}

  {services.length === 0 && (
    <div className="border border-dashed border-white/5 rounded-[32px] py-12 flex flex-col items-center justify-center gap-3">
       <Briefcase size={24} className="text-zinc-800" />
       <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
         Inventory Empty: No Services Cataloged
       </p>
    </div>
  )}
</div>
            </div>

            {/* GALLERY SECTION */}
            <div className="border border-white/25 p-8 rounded-[40px] space-y-6">
                <div className="flex items-center gap-3 text-brandRed px-2">
                  <Camera size={20}/>
                  <label className="text-[11px] font-black uppercase tracking-widest text-white">Media Gallery *</label>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 pt-4 no-scrollbar overflow-y-visible">
                    {gallery.map((img) => (
                        <div key={img.id} className="relative flex-shrink-0 group">
                          <button 
                            type="button" 
                            onClick={() => setThumbnailId(img.id)} 
                            className={`relative w-32 h-32 rounded-[24px] overflow-hidden border-2 transition-all ${
                              thumbnailId === img.id ? 'border-brandRed scale-105 shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'border-white/5 opacity-40'
                            }`}
                          >
                              <img src={img.previewUrl} className="w-full h-full object-cover" alt="Gallery Asset" />
                              {thumbnailId === img.id && (
                                <div className="absolute inset-0 bg-brandRed/20 flex items-center justify-center text-white">
                                  <Check size={20} strokeWidth={4} />
                                </div>
                              )}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveImage(img.id)} 
                            className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-[30] shadow-xl border-2 border-[#030303]"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                    ))}
                    {gallery.length < 5 && (
                      <label className="shrink-0 w-32 h-32 border-2 border-dashed border-white/25 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-brandRed transition-all text-zinc-700">
                        <Plus size={24} />
                        <input type="file" multiple className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                </div>
                <p className="text-[10px] text-zinc-500 font-bold italic uppercase px-2">* Choose the primary card cover</p>
            </div>

            <div className="border border-white/25 p-8 rounded-[40px] focus-within:border-brandRed transition-all">
                <label className="text-[10px] font-black uppercase text-zinc-500 mb-4 block ml-2">Description / Bio *</label>
                <textarea 
                  placeholder="TELL YOUR STORY..." 
                  className="w-full bg-transparent outline-none min-h-[150px] font-medium italic text-white text-lg leading-relaxed px-2" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
            </div>

            {/* DIGITAL CONNECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'WhatsApp Contact *', icon: Phone, key: 'contact', placeholder: '10 DIGITS' },
                  { label: 'WhatsApp Group Link', icon: LinkIcon, key: 'link', placeholder: 'HTTPS://CHAT...' },
                  { label: 'Instagram Handle', icon: Instagram, key: 'instagram', placeholder: '@USERNAME' },
                  { label: 'Official Website', icon: Globe, key: 'website', placeholder: 'WWW.DOMAIN.COM' }
                ].map((field) => (
                  <div key={field.key} className="border border-white/25 p-6 rounded-[32px] focus-within:border-brandRed transition-all">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">{field.label}</label>
                    <div className="relative flex items-center mt-2">
                      <field.icon className="text-zinc-600 mr-3" size={16} />
                      <input 
                        placeholder={field.placeholder} 
                        maxLength={field.key === 'contact' ? 10 : 200}
                        className="w-full bg-transparent outline-none font-bold text-white text-sm" 
                        value={formData[field.key as keyof typeof formData]} 
                        onChange={e => setFormData({...formData, [field.key]: field.key === 'contact' ? e.target.value.replace(/\D/g,'') : e.target.value})} 
                      />
                    </div>
                  </div>
                ))}
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="w-full py-8 bg-brandRed text-white rounded-[32px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-white hover:text-black transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Finalize Submission'}
            </button>
          </motion.div>
          
        )}
        <LaserDivider/>
      </div>
    </div>
  );
}