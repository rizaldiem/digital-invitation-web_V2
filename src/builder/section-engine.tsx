import HeroSection from "@/sections/hero-section"
import CoupleProfile from "@/sections/couple-profile"
import LoveTimeline from "@/sections/love-timeline"
import EventDetails from "@/sections/event-details"
import PhotoGallery from "@/sections/photo-gallery"
import RsvpForm from "@/sections/rsvp-form"
import GiftSection from "@/sections/gift-section"

export const sectionRegistry = {
  hero: HeroSection,
  couple: CoupleProfile,
  timeline: LoveTimeline,
  event: EventDetails,
  gallery: PhotoGallery,
  rsvp: RsvpForm,
  gift: GiftSection,
}

export function renderSection(key: string, props: any) {
  const Component = sectionRegistry[key as keyof typeof sectionRegistry]

  if (!Component) return null

  return <Component {...props} />
}