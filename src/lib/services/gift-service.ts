import { supabase } from "@/lib/supabase/client"
import { GiftAccount } from "@/types/database"

export async function getGiftAccounts(): Promise<GiftAccount[]> {
  const { data, error } = await supabase
    .from("gift_accounts")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching gift accounts:", error)
    return []
  }

  return data || []
}

export async function getGiftAccount(id: string): Promise<GiftAccount | null> {
  const { data, error } = await supabase
    .from("gift_accounts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching gift account:", error)
    return null
  }

  return data
}