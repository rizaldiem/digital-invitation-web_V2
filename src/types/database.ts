export type Guest = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  category: string;
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  pax: number;
  created_at: string;
};

export type Wish = {
  id: string;
  name: string;
  message: string;
  created_at: string;
};

export type WeddingConfig = {
  id: string;
  key: string;
  value: string;
  display_order?: number;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type GiftAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  display_order: number;
  created_at: string;
};
