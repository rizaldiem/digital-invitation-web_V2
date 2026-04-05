import Papa from "papaparse"
import { Guest } from "@/types/database"
import { supabase } from "@/lib/supabase/client"

export function exportGuestsToCSV(guests: Guest[]) {
  const data = guests.map(guest => ({
    Name: guest.name,
    Phone: guest.phone || "",
    Category: guest.category || "",
    Pax: guest.pax || 1,
  }))

  const csv = Papa.unparse(data, {
    quotes: true,
  })

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `guest-list-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface ParsedGuestRow {
  Name: string
  Phone?: string
  Category?: string
  Pax?: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export async function parseAndImportGuests(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, failed: 0, errors: [] }
    const validCategories = ["family", "friends", "colleagues", "vip", ""]

    Papa.parse<ParsedGuestRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
        const total = rows.length

        if (total > 1000) {
          result.errors.push(`Maximum 1000 guests allowed. Found ${total} rows.`)
          resolve(result)
          return
        }

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowNum = i + 2

          if (!row.Name || row.Name.trim() === "") {
            result.failed++
            result.errors.push(`Row ${rowNum}: Name is required`)
            continue
          }

          const name = row.Name.trim()
          const phone = row.Phone?.trim() || ""
          const category = (row.Category?.trim() || "").toLowerCase()
          const pax = Math.min(Math.max(parseInt(row.Pax || "1") || 1, 1), 5)

          if (category && !validCategories.includes(category)) {
            result.failed++
            result.errors.push(`Row ${rowNum}: Invalid category "${row.Category}". Use: family, friends, colleagues, vip`)
            continue
          }

          const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")

          const { error } = await supabase.rpc("upsert_guest", {
            p_name: name,
            p_slug: slug,
            p_phone: phone,
            p_category: category,
            p_pax: pax,
          })

          if (error) {
            const { data: existing } = await supabase
              .from("guests")
              .select("id")
              .eq("name", name)
              .single()

            if (existing) {
              const { error: updateError } = await supabase
                .from("guests")
                .update({
                  phone: phone || null,
                  category: category || null,
                  pax: pax,
                })
                .eq("id", existing.id)

              if (updateError) {
                result.failed++
                result.errors.push(`Row ${rowNum}: Failed to update guest "${name}"`)
                continue
              }
            } else {
              result.failed++
              result.errors.push(`Row ${rowNum}: Failed to import "${name}"`)
              continue
            }
          }

          result.success++

          if (onProgress) {
            onProgress(Math.round(((i + 1) / total) * 100))
          }
        }

        resolve(result)
      },
      error: (error) => {
        result.errors.push(`Parse error: ${error.message}`)
        resolve(result)
      },
    })
  })
}

export { supabase }
