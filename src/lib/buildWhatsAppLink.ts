export function buildWhatsAppLink(phone: string, message: string): string {
  if (!phone) return ''
  
  const cleanPhone = formatPhoneForWhatsApp(phone)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

export function buildWhatsAppLinkWithText(phone: string, text: string): string {
  if (!phone) return ''
  return buildWhatsAppLink(phone, text)
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.slice(1)
  }
  if (cleaned.startsWith('62')) {
    return cleaned
  }
  if (cleaned.startsWith('+')) {
    return cleaned.slice(1)
  }
  return cleaned
}
