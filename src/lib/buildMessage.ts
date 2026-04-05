import { supabase } from '@/lib/supabase/client'

export interface TemplateVariation {
  id: string
  text: string
}

export interface MessageData {
  guest_name: string
  bride_name: string
  groom_name: string
  wedding_date: string
  venue_name: string
  invite_link: string
}

const DEFAULT_MESSAGE = `Kepada Yth. {{guest_name}}

Dengan penuh kebahagiaan kami mengundang Anda untuk menghadiri pernikahan {{bride_name}} & {{groom_name}}.

📅 {{wedding_date}}
📍 {{venue_name}}

Buka undangan: {{invite_link}}

Hormat kami,
{{bride_name}} & {{groom_name}}`

export async function getMessageVariations(): Promise<TemplateVariation[]> {
  const { data, error } = await supabase
    .from('wedding_config')
    .select('value')
    .eq('key', 'whatsapp_template_variations')
    .single()

  if (error || !data?.value) {
    return []
  }

  try {
    return JSON.parse(data.value) as TemplateVariation[]
  } catch {
    return []
  }
}

export async function getRandomMessageVariation(): Promise<TemplateVariation | null> {
  const variations = await getMessageVariations()
  
  if (variations.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * variations.length)
  return variations[randomIndex]
}

export function replacePlaceholders(text: string, data: MessageData): string {
  return text
    .replace(/{{guest_name}}/g, data.guest_name)
    .replace(/{{bride_name}}/g, data.bride_name)
    .replace(/{{groom_name}}/g, data.groom_name)
    .replace(/{{wedding_date}}/g, data.wedding_date)
    .replace(/{{venue_name}}/g, data.venue_name)
    .replace(/{{invite_link}}/g, data.invite_link)
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
}

export function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(' ')[0] || ''
}

export async function buildInviteMessage(
  guestName: string,
  inviteLink: string,
  config: Record<string, string>
): Promise<string> {
  const variation = await getRandomMessageVariation()

  const data: MessageData = {
    guest_name: guestName,
    bride_name: extractFirstName(config.bride_name) || extractFirstName('Flara'),
    groom_name: extractFirstName(config.groom_name) || extractFirstName('Kelvin'),
    wedding_date: config.wedding_date || '',
    venue_name: config.venue_name || '',
    invite_link: inviteLink,
  }

  if (!variation) {
    return replacePlaceholders(DEFAULT_MESSAGE, data)
  }

  return replacePlaceholders(variation.text, data)
}

export function getInviteLink(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/invite/${slug}`
}
