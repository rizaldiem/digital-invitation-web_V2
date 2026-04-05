import Papa from "papaparse"
import { Guest } from "@/types/database"

export function exportGuestsToCSV(guests: Guest[]): void {
  const data = guests.map((guest) => ({
    Name: guest.name,
    Phone: guest.phone || "",
    Category: guest.category || "",
    Pax: guest.pax,
    "RSVP Status": guest.rsvp_status,
    "Created At": guest.created_at ? new Date(guest.created_at).toLocaleDateString("id-ID") : "",
  }))

  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  const timestamp = new Date().toISOString().split("T")[0]
  link.setAttribute("href", url)
  link.setAttribute("download", `guest-list-${timestamp}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface ParsedGuestRow {
  Name: string
  Phone?: string
  Category?: string
  Pax?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateGuestRow(row: ParsedGuestRow, index: number): ValidationResult {
  const errors: string[] = []

  if (!row.Name || row.Name.trim() === "") {
    errors.push(`Row ${index + 1}: Name is required`)
  }

  const validCategories = ["family", "friends", "colleagues", "vip", ""]
  if (row.Category && !validCategories.includes(row.Category.toLowerCase())) {
    errors.push(`Row ${index + 1}: Invalid category "${row.Category}". Valid: family, friends, colleagues, vip`)
  }

  if (row.Pax) {
    const paxNum = parseInt(row.Pax, 10)
    if (isNaN(paxNum) || paxNum < 1 || paxNum > 5) {
      errors.push(`Row ${index + 1}: Pax must be 1-5`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function parseCSV(file: File): Promise<{ data: ParsedGuestRow[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const data: ParsedGuestRow[] = []

        if (results.data.length > 1000) {
          errors.push("Maximum 1000 guests allowed per import")
          resolve({ data: [], errors })
          return
        }

        results.data.forEach((row: any, index: number) => {
          const validation = validateGuestRow(row as ParsedGuestRow, index)
          if (validation.valid) {
            data.push(row as ParsedGuestRow)
          } else {
            errors.push(...validation.errors)
          }
        })

        resolve({ data, errors })
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] })
      },
    })
  })
}

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
  const random = Math.random().toString(36).substring(2, 7)
  return `${slug}-${random}`
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export async function importGuests(
  guests: ParsedGuestRow[],
  supabaseClient: any
): Promise<ImportResult> {
  const errors: string[] = []
  let success = 0
  let failed = 0

  for (const guest of guests) {
    try {
      const slug = generateSlug(guest.Name)
      const { error } = await supabaseClient.from("guests").upsert(
        {
          name: guest.Name.trim(),
          slug,
          phone: guest.Phone?.trim() || null,
          category: guest.Category?.toLowerCase() || "friends",
          pax: guest.Pax ? parseInt(guest.Pax, 10) : 1,
          rsvp_status: "pending",
        },
        { onConflict: "name" }
      )

      if (error) {
        errors.push(`Failed to import "${guest.Name}": ${error.message}`)
        failed++
      } else {
        success++
      }
    } catch (e: any) {
      errors.push(`Failed to import "${guest.Name}": ${e.message}`)
      failed++
    }
  }

  return { success, failed, errors }
}
