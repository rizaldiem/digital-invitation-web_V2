'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface VideoBackgroundProps {
  enabled: boolean;
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

export default function VideoBackground({ enabled }: VideoBackgroundProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('wedding_config')
        .select('key, value');
      
      if (data) {
        const configMap: Record<string, string> = {};
        data.forEach((item) => { configMap[item.key] = item.value; });
        setConfig(configMap);
      }
    }
    fetchData();

    const channel = supabase
      .channel('video-bg-config')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wedding_config'
      }, (payload: any) => {
        if (payload.new && payload.new.key) {
          setConfig(prev => ({
            ...prev,
            [payload.new.key]: payload.new.value
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!enabled) return null;

  const cleanVideoType = config.cover_video_type?.replace(/"/g, '').trim().toLowerCase() || '';
  const cleanVideoUrl = config.cover_video_url?.replace(/"/g, '') || '';
  const showLocalVideo = cleanVideoType === 'local' && cleanVideoUrl && !videoError;
  const showYouTube = cleanVideoType === 'youtube' && cleanVideoUrl;

  if (!showLocalVideo && !showYouTube) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {showYouTube ? (
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
          onError={() => setVideoError(true)}
        >
          <source src={cleanVideoUrl} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
