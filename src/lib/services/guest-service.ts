import { supabase } from "@/lib/supabase/client"
import { Guest } from "@/types/database"

export async function getGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching guests:", error)
    return []
  }

  return data || []
}

export async function getGuestBySlug(slug: string): Promise<Guest | null> {
  console.log("[GuestService] getGuestBySlug called with slug:", slug)
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching guest by slug:", error)
    return null
  }

  console.log("[GuestService] Guest found:", data?.name)
  return data
}

export async function updateGuestRsvp(
  id: string, 
  status: 'pending' | 'confirmed' | 'declined',
  pax: number
): Promise<Guest | null> {
  const { data, error } = await supabase
    .from("guests")
    .update({ rsvp_status: status, pax })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating guest RSVP:", error)
    return null
  }

  return data
}

export async function createGuest(
  guestData: Omit<Guest, 'id' | 'created_at'>
): Promise<Guest | null> {
  const { data, error } = await supabase
    .from("guests")
    .insert([guestData])
    .select()
    .single()

  if (error) {
    console.error("Error creating guest:", error)
    return null
  }

  return data
}
