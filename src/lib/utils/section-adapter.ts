import { SectionProps, extractHeroData, extractCoupleData, extractEventData, extractTimelineData, formatWeddingDate, isLegacyHeroProps, isLegacyCoupleProps, isLegacyEventProps } from "@/types/section"

/**
 * Adapter utility to convert SectionProps to legacy component props
 * This enables backward compatibility during migration
 */

// Type for components that can accept both new and old props
export type AdaptableProps<T> = T | SectionProps

// Helper function to extract first name from full name
export function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(' ')[0] || ''
}

// Check if props are already in legacy format
export function isLegacyProps<T>(props: AdaptableProps<T>, checker: (props: any) => boolean): props is T {
  return checker(props)
}

// HeroSection adapter
export function adaptHeroProps(props: AdaptableProps<any>) {
  if (isLegacyHeroProps(props)) {
    return props
  }
  
  const sectionProps = props as SectionProps
  return extractHeroData(sectionProps.data)
}

// CoupleProfile adapter  
export function adaptCoupleProps(props: AdaptableProps<any>) {
  if (isLegacyCoupleProps(props)) {
    return props
  }
  
  const sectionProps = props as SectionProps
  return extractCoupleData(sectionProps.data)
}

// EventDetails adapter
export function adaptEventProps(props: AdaptableProps<any>, coupleName?: string) {
  if (isLegacyEventProps(props)) {
    return props
  }
  
  const sectionProps = props as SectionProps
  const eventData = extractEventData(sectionProps.data)
  
  return {
    ...eventData,
    coupleName: coupleName || getCoupleName(sectionProps.data)
  }
}

// LoveTimeline adapter
export function adaptTimelineProps(props: AdaptableProps<any>, coupleName?: string) {
  const sectionProps = props as SectionProps
  return {
    items: extractTimelineData(sectionProps.data),
    coupleName: coupleName || getCoupleName(sectionProps.data)
  }
}

// Helper function to get couple name from data
export function getCoupleName(data: Record<string, any>): string {
  const bride = extractFirstName(data.bride_name)
  const groom = extractFirstName(data.groom_name)
  return bride && groom ? `${bride} & ${groom}` : `${extractFirstName('Flara')} & ${extractFirstName('Kelvin')}`
}

// Format wedding date with fallback
export function getFormattedWeddingDate(data: Record<string, any>): string {
  return formatWeddingDate(data.wedding_date)
}

// Get full section props with defaults
export function getFullSectionProps(props: SectionProps, guestName?: string) {
  return {
    ...props,
    data: {
      // Provide defaults for common fields (extract first names)
      bride_name: extractFirstName(props.data?.bride_name) || extractFirstName('Flara'),
      groom_name: extractFirstName(props.data?.groom_name) || extractFirstName('Kelvin'),
      wedding_date: '2024-09-23',
      ...props.data
    },
    guest: props.guest || undefined,
    theme: props.theme || {
      primary_color: '#4f46e5',
      secondary_color: '#ec4899',
      accent_color: '#f59e0b',
      background_color: '#ffffff',
    }
  }
}