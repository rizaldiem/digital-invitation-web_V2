import { supabase } from "@/lib/supabase/client"
import { GalleryItem } from "@/types/database"

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("display_order", { ascending: true })
    .gte('created_at', '1970-01-01') // Prevent caching

  if (error) {
    console.error("Error fetching gallery items:", error)
    return []
  }

  return data || []
}

export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching gallery item:", error)
    return null
  }

  return data
}

export async function getGalleryItemsBySection(sectionKey: string): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("section", sectionKey)
    .order("display_order", { ascending: true })

  if (error) {
    console.error(`Error fetching gallery items for section ${sectionKey}:`, error)
    return []
  }

  return data || []
}