'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Wish, Guest } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Heart, Users, Check, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { toast } from 'sonner';
import { AccessCard } from './access-card';
import { Toaster } from '@/components/ui/sonner';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

function WishCarousel({ wishes, isLoading }: { wishes: Wish[]; isLoading: boolean }) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const latestWishes = wishes.slice(0, 10);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/50 backdrop-blur-md rounded-xl shadow-sm p-5 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-primary/20 rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (latestWishes.length === 0) {
      return (
      <div className="text-center py-12 bg-white/50 backdrop-blur-md rounded-xl shadow-sm">
        <MessageCircle className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <p className="text-primary/60">Belum ada ucapan. Jadilah yang pertama!</p>
      </div>
    );
  }

  const duplicatedWishes = [...latestWishes, ...latestWishes];

  return (
    <div 
      ref={containerRef}
      className="overflow-hidden h-[400px] relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      
      <motion.div
        animate={isPaused ? { y: 0 } : { y: [0, -((latestWishes.length * 140))] } }
        transition={{ 
          duration: latestWishes.length * 5,
          repeat: Infinity, 
          ease: "linear"
        }}
        className="flex flex-col gap-3"
      >
        {duplicatedWishes.map((wish, i) => (
          <motion.div
            key={`${wish.id}-${i}`}
            className="bg-white/50 backdrop-blur-md rounded-xl shadow-sm p-5 flex-shrink-0"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">{wish.name}</p>
                <p className="text-primary/60 mt-1 text-sm">{wish.message}</p>
                <p className="text-xs text-primary/60 mt-2">
                  {new Date(wish.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function RsvpForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const toParam = searchParams.get('to') || '';
  
  const [guest, setGuest] = useState<Guest | null>(null);
  const [guestLoading, setGuestLoading] = useState(true);
  const [guestError, setGuestError] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'confirmed' | 'declined'>('pending');
  const [pax, setPax] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rsvpChoice, setRsvpChoice] = useState<'confirmed' | 'declined' | null>(null);
  
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesLoading, setWishesLoading] = useState(true);
  const [wishMessage, setWishMessage] = useState('');
  const [inputName, setInputName] = useState('');
  const [nameError, setNameError] = useState('');

  const isGuestMode = !slug && !guest;

  const fetchWishes = useCallback(async () => {
    setWishesLoading(true);
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setWishes(data);
    setWishesLoading(false);
  }, []);

  const fetchGuestBySlug = useCallback(async () => {
    if (!slug) {
      setGuestLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      setGuestError(true);
    } else {
      setGuest(data);
      setRsvpStatus(data.rsvp_status);
      setPax(data.pax || 1);
    }
    setGuestLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchGuestBySlug();
    fetchWishes();

    const channel = supabase
      .channel('wishes-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
        setWishes((prev) => [payload.new as Wish, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGuestBySlug, fetchWishes]);

  useEffect(() => {
    if (toParam) {
      setInputName(decodeURIComponent(toParam))
    }
  }, [toParam])

  const handleSubmit = async () => {
    if (isGuestMode && !inputName.trim()) {
      setNameError('Nama wajib diisi')
      return
    }
    
    if (!rsvpChoice) return
    
    const finalName = isGuestMode ? inputName.trim() : guest?.name || ''
    
    setLoading(true)
    
    if (isGuestMode) {
      const newSlug = generateSlug(finalName)
      const { error: guestError } = await supabase
        .from('guests')
        .insert({
          name: finalName,
          slug: newSlug,
          rsvp_status: rsvpChoice,
          pax: rsvpChoice === 'confirmed' ? pax : 0,
          category: 'walk-in',
          phone: null,
        })
      
      if (guestError) {
        console.error('Error inserting guest:', guestError)
        toast.error('Gagal menyimpan data')
        setLoading(false)
        return
      }
    } else {
      await supabase
        .from('guests')
        .update({ 
          rsvp_status: rsvpChoice, 
          pax: rsvpChoice === 'confirmed' ? pax : 0 
        })
        .eq('slug', slug)
    }

    if (wishMessage.trim()) {
      await supabase
        .from('wishes')
        .insert({ name: finalName, message: wishMessage });
    }

    toast.success('RSVP berhasil disimpan!')
    setRsvpStatus(rsvpChoice);
    setSubmitted(true);
    setLoading(false);
  };

  if (guestLoading) {
    return (
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    );
  }

  if ((guestError || !guest) && !isGuestMode) {
    return (
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--background)' }}>
        <Toaster position="top-center" />
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-serif text-2xl text-primary mb-2">
              Undangan Tidak Ditemukan
            </h3>
            <p className="text-primary/60">
              Link undangan yang Anda gunakan tidak valid.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-primary/5">
      <Toaster position="top-center" />
      
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-light tracking-wider text-primary mb-4">
            {invitationText.rsvpTitle}
          </h2>
          <p className="text-primary/60">
            Mohon konfirmasi kehadiran Anda pada hari bahagia kami
          </p>
        </motion.div>

        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-8 space-y-6"
          >
            {/* Guest Name */}
            <div className="text-center">
              {isGuestMode ? (
                <div className="mt-4">
                  <label className="text-sm text-primary/60 mb-2 block">
                    Nama Tamu
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama Anda"
                    className="w-full px-4 py-3 border border-primary/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value)
                      setNameError('')
                    }}
                  />
                  {nameError && (
                    <p className="text-red-500 text-sm mt-1">{nameError}</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-primary/60 uppercase tracking-wider mb-2">
                    Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <h3 className="font-serif text-2xl text-primary">
                    {guest?.name}
                  </h3>
                </>
              )}
            </div>

            {/* Buttons - Hadir / Tidak Hadir */}
            <div className="space-y-3">
              <label className="text-primary font-medium">
                {invitationText.rsvpTitle}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  onClick={() => setRsvpChoice('confirmed')}
                  className={cn(
                    "h-12 text-base transition-all",
                    rsvpChoice === 'confirmed' 
                      ? "bg-primary hover:bg-primary/80 text-white" 
                      : "bg-background border-2 border-primary/30 text-primary hover:bg-primary/5"
                  )}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Hadir
                </Button>
                <Button
                  type="button"
                  onClick={() => setRsvpChoice('declined')}
                  className={cn(
                    "h-12 text-base transition-all",
                    rsvpChoice === 'declined' 
                      ? "bg-primary hover:bg-primary/80 text-white" 
                      : "bg-background border-2 border-primary/30 text-primary hover:bg-primary/5"
                  )}
                >
                  Tidak Hadir
                </Button>
              </div>
            </div>

            {/* Pax - Animated hide when "Tidak Hadir" */}
            <motion.div
              animate={{ 
                height: rsvpChoice === 'declined' ? 0 : 'auto',
                opacity: rsvpChoice === 'declined' ? 0 : 1,
                marginTop: rsvpChoice === 'declined' ? 0 : 24
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={rsvpChoice === 'declined' ? 'invisible' : ''}>
<label className="flex items-center gap-2 text-primary mb-3 font-medium">
                  <Users className="w-5 h-5" />
                  {invitationText.rsvp.paxLabel}
                </label>
                <select
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="w-full p-3 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Orang' : 'Orang'}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Wish Form - Hidden name field, only message */}
            <div className="p-6 bg-white/50 backdrop-blur-md rounded-xl space-y-4">
              <h4 className="font-medium text-primary flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {invitationText.rsvp.wishTitle}
              </h4>
              <textarea
                placeholder={invitationText.rsvp.wishPlaceholder}
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                className="w-full p-3 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                rows={3}
              />
            </div>

            {/* Unified Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !rsvpChoice || (isGuestMode && !inputName.trim())}
              className="w-full bg-primary hover:bg-primary/80 h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {invitationText.rsvp.submitRsvp}
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-8 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-serif text-2xl text-primary mb-2">
              Terima Kasih!
            </h3>
            <p className="text-primary/60 mb-8">
              {rsvpStatus === 'confirmed'
                ? `Kehadiran Anda dengan ${pax} tamu telah dikonfirmasi. Sampai jumpa di hari bahagia kami!`
                : 'Mohon maaf atas ketidaknyamanan Anda. Kami berharap dapat bertemu di lain waktu.'}
            </p>
            
            {!isGuestMode && <AccessCard guestName={guest?.name || ''} />}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-light tracking-wider text-primary mb-4">
              Wall of Wishes
            </h2>
            <p className="text-primary/60">
              Sampaikan harapan dan doa terbaik untuk kami
            </p>
          </div>

          <WishCarousel wishes={wishes} isLoading={wishesLoading} />
        </motion.div>
      </SectionContainer>
    </section>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
