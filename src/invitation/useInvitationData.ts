import { supabase } from "@/lib/supabase/client"

export async function getWeddingConfig() {
  const { data, error } = await supabase
    .from("wedding_config")
    .select("*")

  if (error) {
    console.error(error)
    return []
  }

  return data
}
