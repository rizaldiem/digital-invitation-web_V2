'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { GalleryItem } from '@/types/database';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import SectionContainer from '@/components/invitation/SectionContainer';
import { invitationText } from '@/content/invitation-text';

export default function PhotoGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fetchGallery = useCallback(async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('display_order', { ascending: true })
      .gte('created_at', '1970-01-01'); // Force fresh query

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGallery();

    // Real-time subscription - but only ADD/UPDATE, not DELETE restore
    const channel = supabase
      .channel('gallery-changes-photo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gallery' },
        (payload) => {
          setItems((prev) => {
            // Only add if not already present
            if (prev.some(item => item.id === (payload.new as GalleryItem).id)) {
              return prev;
            }
            return [...prev, payload.new as GalleryItem];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGallery]);

  const validItems = (items || []).filter(
    (item) => item?.url && item.url.trim() !== ""
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i === null ? null : i > 0 ? i - 1 : validItems.length - 1);
      if (e.key === 'ArrowRight') setLightboxIndex(i => i === null ? null : i < validItems.length - 1 ? i + 1 : 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, validItems.length]);

  if (loading) {
    return (
      <section className="py-16" style={{ backgroundColor: 'var(--background)' }}>
        <SectionContainer>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </SectionContainer>
      </section>
    );
  }

  if (validItems.length === 0) {
    return (
      <section className="py-16" style={{ backgroundColor: 'var(--background)' }}>
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-primary mb-4">
              {invitationText.sections.galleryTitle}
            </h2>
            <p className="text-primary/60">
              {invitationText.sections.gallerySubtitle}
            </p>
          </motion.div>
          <p className="text-center text-primary/60 py-8">Belum ada foto ditambahkan</p>
        </SectionContainer>
      </section>
    );
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--background)' }}>
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-primary mb-4">
            {invitationText.sections.galleryTitle}
          </h2>
          <p className="text-primary/60">
            {invitationText.sections.gallerySubtitle}
          </p>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {validItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="break-inside-avoid"
            >
              <div
                onClick={() => setLightboxIndex(index)}
                className="relative group cursor-pointer rounded-lg overflow-hidden"
              >
                {failedImages.has(item.id) ? (
                  <div className="aspect-square flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                    <ImageOff className="w-12 h-12" />
                    <p className="text-sm mt-2">Gambar tidak tersedia</p>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || 'Wedding photo'}
                    onError={() => setFailedImages(prev => new Set(prev).add(item.id))}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm">{item.caption}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
            )}

            {lightboxIndex < validItems.length - 1 && (
              <button
                className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={validItems[lightboxIndex]?.url}
                alt={validItems[lightboxIndex]?.caption || 'Gallery image'}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {validItems[lightboxIndex]?.caption && (
                <p className="text-center text-white/80 mt-4">
                  {validItems[lightboxIndex].caption}
                </p>
              )}
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {validItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
