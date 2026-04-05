'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Volume2, VolumeX } from 'lucide-react';
import { invitationText } from '@/content/invitation-text';
import { extractFirstName } from '@/lib/utils/section-adapter';

interface CoverScreenProps {
  onOpen: () => void;
  onPlayAudio?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  hasAudio?: boolean;
}

function formatWeddingDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVideoOpacity(opacityStr: string | undefined): number {
  const parsed = parseInt(opacityStr || '60', 10);
  if (isNaN(parsed) || parsed < 0) return 0.6;
  if (parsed > 100) return 1;
  return parsed / 100;
}

export default function CoverScreen({ onOpen, onPlayAudio, onToggleMute, isMuted: propIsMuted, hasAudio }: CoverScreenProps) {
  const searchParams = useSearchParams();
  const [isOpened, setIsOpened] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoaded, setConfigLoaded] = useState(false);
  const [guestName, setGuestName] = useState('Tamu Undangan');
  const [videoError, setVideoError] = useState(false);

  const cleanVideoType = config.cover_video_type?.replace(/"/g, '').trim().toLowerCase() || '';
  const cleanVideoUrl = config.cover_video_url?.replace(/"/g, '') || '';
  const cleanPosterUrl = config.cover_poster_url?.replace(/"/g, '') || '';
  
  const showLocalVideo = configLoaded && cleanVideoType === 'local' && cleanVideoUrl && !videoError;
  const showYouTube = configLoaded && cleanVideoType === 'youtube' && cleanVideoUrl;
  const showPoster = configLoaded && (cleanPosterUrl || (!cleanVideoUrl && !videoError));

  useEffect(() => {
    async function fetchData() {
      // Fetch wedding config
      const { data: configData } = await supabase
        .from('wedding_config')
        .select('key, value');
      
      if (configData) {
        const configMap: Record<string, string> = {};
        configData.forEach((item) => { configMap[item.key] = item.value; });
        setConfig(configMap);
        setConfigLoaded(true);
      }

      // Fetch guest by slug
      const slug = searchParams.get('slug');
      if (slug) {
        const { data: guest } = await supabase
          .from('guests')
          .select('name')
          .eq('slug', slug)
          .single();
        
        if (guest) {
          setGuestName(guest.name);
        }
      }
    }
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVideoLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpened(true);
    if (hasAudio && onPlayAudio) {
      onPlayAudio();
    }
    setTimeout(() => {
      onOpen();
    }, 800);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMute) {
      onToggleMute();
    }
  };

  return (
    <AnimatePresence>
      {!isOpened && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        >
          {hasAudio && (
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={propIsMuted ? "Unmute" : "Mute"}
            >
              {propIsMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          <div className="absolute inset-0 bg-black">
            {!configLoaded ? (
              <div className="flex h-full w-full items-center justify-center bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : showYouTube ? (
              <div className="relative h-full w-full overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(cleanVideoUrl)}?autoplay=1&mute=1&loop=1&controls=0&playlist=${extractYouTubeId(cleanVideoUrl)}`}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ opacity: getVideoOpacity(config.cover_video_opacity) }}
                />
              </div>
            ) : showLocalVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
                style={{ opacity: getVideoOpacity(config.cover_video_opacity) }}
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => {
                  console.error('Video failed to load:', cleanVideoUrl);
                  setVideoError(true);
                }}
              >
                <source src={cleanVideoUrl} type="video/mp4" />
              </video>
            ) : showPoster ? (
              <img
                src={cleanPosterUrl || '/cover-poster.jpg'}
                alt="Cover"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-900 to-rose-700" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

          <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className="font-serif text-lg tracking-[0.3em] text-white/90 uppercase">
                {invitationText.cover.theWeddingOf}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wider text-white">
                {extractFirstName(config.bride_name) || 'Bride'} &amp; {extractFirstName(config.groom_name) || 'Groom'}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <p className="font-serif text-lg tracking-[0.2em] text-white/80">
                {formatWeddingDate(config.wedding_date)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="mt-8"
            >
              <div className="flex flex-col items-center gap-4">
                <p className="font-serif text-sm tracking-widest text-white/70 uppercase">
                  Yth. Bapak/Ibu/Saudara/i
                </p>
                <p className="font-serif text-2xl md:text-3xl font-medium text-white">
                  {guestName}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.8 }}
              className="mt-12"
            >
              <button
                onClick={handleOpen}
                className="group relative overflow-hidden rounded-full border border-white/30 bg-white/10 px-10 py-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50"
              >
                  <span className="font-serif text-sm font-medium tracking-[0.25em] text-white uppercase">
                    {invitationText.cover.openInvitation}
                  </span>
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVideoLoaded ? 1 : 0 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-px bg-white/50" />
              <p className="text-xs tracking-widest text-white/50 uppercase">{invitationText.cover.scrollText}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
