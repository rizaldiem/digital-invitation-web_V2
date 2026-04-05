import { Guest, WeddingConfig, GalleryItem, GiftAccount } from './database';

export function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(' ')[0] || ''
}

export interface Theme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
}

export interface SectionProps {
  data: Record<string, any>;
  guest?: Guest;
  theme?: Theme;
  settings?: WeddingConfig[];
}

// Section-specific data extractors
export function extractHeroData(data: Record<string, any>) {
  return {
    brideName: extractFirstName(data.bride_name) || extractFirstName('Flara'),
    groomName: extractFirstName(data.groom_name) || extractFirstName('Kelvin'),
    weddingDate: data.wedding_date || 'Sabtu, 23 September 2024',
    quote: data.quote || 'Dan di antara tanda-tanda kebesaran-Nya adalah Dia menciptakan untukmu pasangan dari jenismu sendiri...',
    quoteSource: data.quote_source || 'QS. Ar-Rum: 21',
  };
}

export function extractCoupleData(data: Record<string, any>) {
  return {
    brideName: data.bride_name || 'Flara Patricia',
    brideParents: data.bride_parents || 'Bapak Nama Bapak & Ibu Nama Ibu',
    brideDescription: data.bride_description || 'Putri Pertama Dari',
    brideInstagram: data.bride_instagram || '@flarapatricia',
    bridePhotoUrl: data.bride_photo_url,
    groomName: data.groom_name || 'Kelvin Gunawan',
    groomParents: data.groom_parents || 'Bapak Nama Bapak & Ibu Nama Ibu',
    groomDescription: data.groom_description || 'Putra Pertama Dari',
    groomInstagram: data.groom_instagram || '@kelvingunawan',
    groomPhotoUrl: data.groom_photo_url,
  };
}

export function extractEventData(data: Record<string, any>) {
  return {
    weddingDate: data.wedding_date || '2024-09-23',
    ceremonyTime: data.ceremony_time || '08:00 - 10.00 WIB',
    receptionTime: data.reception_time || '11:00 - 14:00 WIB',
    venueName: data.venue_name || 'Vue Palace Hotel',
    venueAddress: data.venue_address || 'Jl. Otto Iskandar Dinata No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
    venueMapsUrl: data.venue_maps_url || 'https://maps.google.com/?q=Vue+Palace+Hotel+Bandung',
  };
}

export function extractTimelineData(data: Record<string, any>) {
  const storyKeys = ['story_meet', 'story_relationship', 'story_engagement', 'story_wedding'];
  return storyKeys
    .map((key) => {
      const value = data[key];
      if (!value) return null;
      const parts = value.split('||');
      if (parts.length < 3) return null;
      return {
        date: parts[0].trim(),
        title: parts[1].trim(),
        description: parts.slice(2).join('||').trim(),
      };
    })
    .filter((item): item is { date: string; title: string; description: string } => item !== null);
}

export function formatWeddingDate(dateStr: string) {
  if (!dateStr) return 'Sabtu, 23 September 2024';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Type guard for checking if props are legacy format
export function isLegacyHeroProps(props: any): props is {
  brideName: string;
  groomName: string;
  weddingDate: string;
  quote: string;
  quoteSource: string;
} {
  return props && typeof props.brideName === 'string';
}

export function isLegacyCoupleProps(props: any): props is {
  brideName: string;
  brideParents: string;
  brideDescription: string;
  brideInstagram: string;
  bridePhotoUrl?: string;
  groomName: string;
  groomParents: string;
  groomDescription: string;
  groomInstagram: string;
  groomPhotoUrl?: string;
} {
  return props && typeof props.brideName === 'string' && typeof props.groomName === 'string';
}

export function isLegacyEventProps(props: any): props is {
  weddingDate: string;
  ceremonyTime: string;
  receptionTime: string;
  venueName: string;
  venueAddress: string;
  venueMapsUrl: string;
  coupleName: string;
} {
  return props && typeof props.venueName === 'string';
}