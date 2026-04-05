import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '-' + randomSuffix
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export const DEFAULT_WEDDING_DOMAIN = "https://your-wedding-domain.com"

export function isValidWeddingDomain(domain: string): boolean {
  if (!domain) return false
  if (domain === DEFAULT_WEDDING_DOMAIN) return false
  if (domain.includes('localhost')) return false
  return domain.startsWith('https://')
}

export function generateInvitationUrl(slug: string, domain?: string): string {
  let baseUrl = domain || DEFAULT_WEDDING_DOMAIN
  
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin
    if (isValidWeddingDomain(baseUrl) && baseUrl !== currentOrigin) {
      // Domain is valid and different from current - use configured domain
    } else if (!isValidWeddingDomain(baseUrl)) {
      // Fallback to current origin if domain is invalid
      baseUrl = currentOrigin
    }
  }
  
  return `${baseUrl}/invite/${encodeURIComponent(slug)}`
}
