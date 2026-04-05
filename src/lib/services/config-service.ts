import { supabase } from "@/lib/supabase/client"
import { WeddingConfig } from "@/types/database"

export async function getWeddingConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("wedding_config")
    .select("*")

  if (error) {
    console.error("Error fetching wedding config:", error)
    return {}
  }

  const configMap: Record<string, string> = {}
  data?.forEach((item) => {
    configMap[item.key] = item.value
  })

  return configMap
}

export async function getAnimationEnabled(): Promise<boolean> {
  const config = await getWeddingConfig()
  const animationsEnabled = config.animations_enabled
  return animationsEnabled === 'true' || animationsEnabled === '1' || animationsEnabled === undefined
}

export async function getWeddingConfigArray(): Promise<WeddingConfig[]> {
  const { data, error } = await supabase
    .from("wedding_config")
    .select("*")
    .order("display_order")

  if (error) {
    console.error("Error fetching wedding config array:", error)
    return []
  }

  return data || []
}

export async function getSectionOrder(): Promise<Array<{
  key: string;
  displayOrder: number;
  enabled: boolean;
}>> {
  const data = await getWeddingConfigArray()
  const sectionKeys = ['section_venue', 'section_hero', 'section_couple', 'section_story', 'section_gallery', 'section_rsvp', 'section_gift']
  
  const orderFromDb = data.filter(item => sectionKeys.includes(item.key))
  if (orderFromDb.length > 0) {
    return orderFromDb
      .map(item => ({
        key: item.key,
        displayOrder: item.display_order || 99,
        enabled: item.value !== 'false'
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }

  // Default order
  return [
    { key: 'section_hero', displayOrder: 1, enabled: true },
    { key: 'section_couple', displayOrder: 2, enabled: true },
    { key: 'section_story', displayOrder: 3, enabled: true },
    { key: 'section_venue', displayOrder: 4, enabled: true },
    { key: 'section_gallery', displayOrder: 5, enabled: true },
    { key: 'section_rsvp', displayOrder: 6, enabled: true },
    { key: 'section_gift', displayOrder: 7, enabled: true },
  ]
}

export async function getThemeSettings(): Promise<{
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
}> {
  const config = await getWeddingConfig()
  return {
    primary_color: config.primary_color || '#4f46e5',
    secondary_color: config.secondary_color || '#ec4899',
    accent_color: config.accent_color || '#f59e0b',
    background_color: config.background_color || '#ffffff',
  }
}

export async function updateConfigValue(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from("wedding_config")
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) {
    console.error("Error updating config value:", error)
    return false
  }

  return true
}