import { Guest, GalleryItem, GiftAccount, Wish } from "@/types/database"
import { Theme } from "@/types/section"
import { getWeddingConfig, getSectionOrder, getThemeSettings } from "./config-service"
import { getGuestBySlug } from "./guest-service"
import { getGalleryItems } from "./gallery-service"
import { getGiftAccounts } from "./gift-service"
import { getRecentWishes } from "./wish-service"

export interface InvitationData {
  config: Record<string, string>;
  guest?: Guest;
  gallery: GalleryItem[];
  gifts: GiftAccount[];
  wishes: Wish[];
  sectionOrder: Array<{ key: string; displayOrder: number; enabled: boolean }>;
  theme: Theme;
}

export async function getInvitationData(slug?: string): Promise<InvitationData> {
  try {
    // Fetch all data in parallel for better performance
    const [
      config,
      guest,
      gallery,
      gifts,
      wishes,
      sectionOrder,
      theme
    ] = await Promise.all([
      getWeddingConfig(),
      slug ? getGuestBySlug(slug) : Promise.resolve(null),
      getGalleryItems(),
      getGiftAccounts(),
      getRecentWishes(10),
      getSectionOrder(),
      getThemeSettings()
    ])

    return {
      config,
      guest: guest || undefined,
      gallery,
      gifts,
      wishes,
      sectionOrder,
      theme
    }
  } catch (error) {
    console.error("Error fetching invitation data:", error)
    // Return empty/default data structure
    return {
      config: {},
      gallery: [],
      gifts: [],
      wishes: [],
      sectionOrder: [],
      theme: {
        primary_color: '#4f46e5',
        secondary_color: '#ec4899',
        accent_color: '#f59e0b',
        background_color: '#ffffff',
      }
    }
  }
}

export async function getInvitationDataForGuest(slug: string) {
  console.log("[InvitationService] getInvitationDataForGuest called with slug:", slug)
  return getInvitationData(slug)
}

export async function getPublicInvitationData() {
  return getInvitationData()
}