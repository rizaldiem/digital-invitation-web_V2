'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { invitationText } from '@/content/invitation-text';
import { extractFirstName } from '@/lib/utils/section-adapter';

// Import services
import { getInvitationData } from '@/lib/services/invitation-service';
import { getAnimationEnabled } from '@/lib/services/config-service';
import AnimatedSection from '@/components/invitation/AnimatedSection';
import SectionDivider from '@/components/invitation/SectionDivider';
// Section types and adapters imported for future use

// Dynamically import sections (same as before)
const CoverScreen = dynamic(
  () => import('@/sections/cover-screen'),
  { ssr: false }
);
const VideoBackground = dynamic(
  () => import('@/sections/video-background'),
  { ssr: false }
);
const HeroSection = dynamic(
  () => import('@/sections/hero-section'),
  { ssr: false }
);
const CoupleProfile = dynamic(
  () => import('@/sections/couple-profile'),
  { ssr: false }
);
const LoveTimeline = dynamic(
  () => import('@/sections/love-timeline'),
  { ssr: false }
);
const EventDetails = dynamic(
  () => import('@/sections/event-details'),
  { ssr: false }
);
const PhotoGallery = dynamic(
  () => import('@/sections/photo-gallery'),
  { ssr: false }
);
const RsvpForm = dynamic(
  () => import('@/sections/rsvp-form'),
  { ssr: false }
);
const GiftSection = dynamic(
  () => import('@/sections/gift-section'),
  { ssr: false }
);

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

export default function Home() {
   return <h1>App is working</h1>
  });
  
  // New state for service-based data
  const [invitationData, setInvitationData] = useState<{
    config: Record<string, string>;
    theme: {
      primary_color: string;
      secondary_color: string;
      accent_color: string;
      background_color: string;
    };
    gallery: any[];
    gifts: any[];
    wishes: any[];
    sectionOrder: Array<{ key: string; displayOrder: number; enabled: boolean }>;
  } | null>(null);
  const [sectionOrder, setSectionOrder] = useState<Array<{ key: string; displayOrder: number; enabled: boolean }>>([]);
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fetch timeout after 10 seconds')), 10000);
        });
        
        const dataPromise = getInvitationData();
        const data = await Promise.race([dataPromise, timeoutPromise]) as any;
        
        setInvitationData(data);
        setSectionOrder(data.sectionOrder || []);
        
        // Set full page video
        setFullPageVideo(data.config?.full_page_video === 'true');
        
        // Get animation setting
        const animationEnabled = await getAnimationEnabled();
        setAnimationEnabled(animationEnabled);
        
        // Set audio state
        const audioUrl = data.config?.bg_music_url;
        if (audioUrl) {
          const youtubeId = extractYouTubeId(audioUrl);
          setAudioState({
            hasAudio: true,
            isPlaying: false,
            isMuted: false,
            type: youtubeId ? 'youtube' : 'local',
            url: audioUrl
          });
        }
      } catch (error) {
        console.error('Error fetching invitation data:', error);
        // Set default data if fetch fails
        setInvitationData({
          config: {
            bride_name: extractFirstName('Flara'),
            groom_name: extractFirstName('Kelvin'),
            wedding_date: '2024-09-23',
          },
          gallery: [],
          gifts: [],
          wishes: [],
          sectionOrder: [
            { key: 'section_hero', displayOrder: 1, enabled: true },
            { key: 'section_couple', displayOrder: 2, enabled: true },
            { key: 'section_story', displayOrder: 3, enabled: true },
            { key: 'section_venue', displayOrder: 4, enabled: true },
            { key: 'section_gallery', displayOrder: 5, enabled: true },
            { key: 'section_rsvp', displayOrder: 6, enabled: true },
            { key: 'section_gift', displayOrder: 7, enabled: true },
          ],
          theme: {
            primary_color: '#4f46e5',
            secondary_color: '#ec4899',
            accent_color: '#f59e0b',
            background_color: '#ffffff',
          }
        });
        setSectionOrder([]);
        setAnimationEnabled(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (audioState.type === 'local' && audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } else if (audioState.type === 'youtube') {
      const iframe = document.getElementById('youtube-music-player') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${extractYouTubeId(audioState.url)}?autoplay=1&mute=1&loop=1&controls=0&playlist=${extractYouTubeId(audioState.url)}`;
      }
    }
  }, [audioState]);

  const handleToggleMute = useCallback(() => {
    setAudioState(prev => {
      const newMuted = !prev.isMuted;
      
      if (prev.type === 'local' && audioRef.current) {
        audioRef.current.muted = newMuted;
      } else if (prev.type === 'youtube') {
        const iframe = document.getElementById('youtube-music-player') as HTMLIFrameElement;
        if (iframe && iframe.src) {
          iframe.src = iframe.src.replace(/mute=\d/, `mute=${newMuted ? 1 : 0}`);
        }
      }
      
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const handleOpen = () => {
    setIsOpened(true);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  // If no invitation data after loading, show error
  if (!invitationData) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load wedding data</h2>
          <p className="text-gray-600">Please check your connection and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <main className="relative" style={{ backgroundColor: 'var(--background)' }}>
        <motion.div
          className="fixed left-0 right-0 top-0 z-40 h-1 origin-left"
          style={{ 
            scaleX,
            backgroundColor: 'var(--primary)'
          }}
        />

        <CoverScreen 
          onOpen={handleOpen} 
          onPlayAudio={handlePlayAudio}
          onToggleMute={handleToggleMute}
          isMuted={audioState.isMuted}
          hasAudio={audioState.hasAudio}
        />

        {audioState.hasAudio && (
          <>
            {audioState.type === 'local' && (
              <audio ref={audioRef} loop preload="auto">
                <source src={audioState.url} type="audio/mpeg" />
              </audio>
            )}
            {audioState.type === 'youtube' && (
              <div className="hidden">
                <iframe
                  id="youtube-music-player"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            )}
          </>
        )}

        {audioState.hasAudio && (
          <button
            onClick={handleToggleMute}
            className="fixed top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label={audioState.isMuted ? "Unmute" : "Mute"}
          >
            {audioState.isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        {isOpened && fullPageVideo && (
          <VideoBackground enabled={fullPageVideo} />
        )}

        {isOpened && (
          <>
            {sectionOrder.filter(s => s.enabled).map((section, index) => {
              const renderSection = () => {
                const sectionProps: Record<string, any> = {
                  data: invitationData.config,
                  theme: invitationData.theme
                };
                
                switch (section.key) {
                  case 'section_hero':
                    return <HeroSection {...sectionProps} />;
                  case 'section_couple':
                    return <CoupleProfile {...sectionProps} />;
                  case 'section_story':
                    return <LoveTimeline {...sectionProps} />;
                  case 'section_gallery':
                    return <PhotoGallery {...sectionProps} />;
                  case 'section_rsvp':
                    return <RsvpForm {...sectionProps} />;
                  case 'section_gift':
                    return <GiftSection {...sectionProps} />;
                  case 'section_venue':
                    return <EventDetails {...sectionProps} />;
                  default:
                    return null;
                }
              };

              const sectionComponent = renderSection();
              if (!sectionComponent) return null;

              const enabledSections = sectionOrder.filter(s => s.enabled);
              const isLastSection = index === enabledSections.length - 1;

              return (
                <div key={section.key}>
                  <AnimatedSection
                    sectionIndex={index}
                    enabled={animationEnabled}
                    id={section.key.replace('section_', '')}
                  >
                    {sectionComponent}
                  </AnimatedSection>
                  {!isLastSection && <SectionDivider />}
                </div>
              );
            })}

<footer className="bg-[#4a4a4a] py-8 text-center">
                <p className="font-serif text-sm text-white/60">
                  {invitationText.footer} © {new Date().getFullYear()}
                </p>
              </footer>
          </>
        )}
      </main>
    </ThemeProvider>
  );
}