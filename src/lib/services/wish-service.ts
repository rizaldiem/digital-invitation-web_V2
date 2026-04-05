import { supabase } from "@/lib/supabase/client"
import { Wish } from "@/types/database"

export async function getWishes(limit: number = 50): Promise<Wish[]> {
  const { data, error } = await supabase
    .from("wishes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching wishes:", error)
    return []
  }

  return data || []
}

export async function createWish(name: string, message: string): Promise<Wish | null> {
  const { data, error } = await supabase
    .from("wishes")
    .insert([{ name, message }])
    .select()
    .single()

  if (error) {
    console.error("Error creating wish:", error)
    return null
  }

  return data
}

export async function getRecentWishes(count: number = 10): Promise<Wish[]> {
  return getWishes(count)
}