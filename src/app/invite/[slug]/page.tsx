"use client"

import { notFound } from "next/navigation"
import dynamic from "next/dynamic"
import { getInvitationDataForGuest } from "@/lib/services/invitation-service"
import { getGuestBySlug } from "@/lib/services/guest-service"
import { getAnimationEnabled } from "@/lib/services/config-service"
import { invitationText } from '@/content/invitation-text'
import { InviteTracker } from '@/components/invitation/InviteTracker'
import AnimatedSection from '@/components/invitation/AnimatedSection'
import SectionDivider from '@/components/invitation/SectionDivider'
import { ThemeProvider } from '@/components/theme-provider'

const CoverScreen = dynamic(() => import('@/sections/cover-screen'), { ssr: false })
const HeroSection = dynamic(() => import('@/sections/hero-section'), { ssr: false })
const CoupleProfile = dynamic(() => import('@/sections/couple-profile'), { ssr: false })
const LoveTimeline = dynamic(() => import('@/sections/love-timeline'), { ssr: false })
const EventDetails = dynamic(() => import('@/sections/event-details'), { ssr: false })
const PhotoGallery = dynamic(() => import('@/sections/photo-gallery'), { ssr: false })
const RsvpForm = dynamic(() => import('@/sections/rsvp-form'), { ssr: false })
const GiftSection = dynamic(() => import('@/sections/gift-section'), { ssr: false })

function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(' ')[0] || ''
}

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  console.log("[InvitePage] Rendering for slug:", slug)

  if (!slug) {
    console.log("[InvitePage] No slug provided")
    notFound()
  }

  try {
    console.log("[InvitePage] Fetching invitation data for:", slug)
    const [invitationData, animationEnabled] = await Promise.all([
      getInvitationDataForGuest(slug),
      getAnimationEnabled()
    ])
    
    console.log("[InvitePage] Invitation data:", JSON.stringify({
      hasGuest: !!invitationData.guest,
      guestName: invitationData.guest?.name,
      configKeys: Object.keys(invitationData.config || {}),
      sectionOrder: invitationData.sectionOrder
    }))

    if (!invitationData.guest) {
      console.log("[InvitePage] Guest not found for slug:", slug)
      notFound()
    }

    const sectionOrder = invitationData.sectionOrder
    const config = invitationData.config
    const theme = invitationData.theme
    const guest = invitationData.guest

    const coupleName = `${extractFirstName(config.bride_name)} & ${extractFirstName(config.groom_name)}`

    const sectionProps: Record<string, any> = {
      data: config,
      theme
    }

    return (
      <InviteTracker slug={slug}>
        <ThemeProvider>
          <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <p className="font-serif text-sm uppercase tracking-wider text-[var(--primary)] mb-2">
                    {invitationText.guestGreeting.prefix}
                  </p>
                  <p className="font-serif text-sm text-[var(--primary)]/60 mb-6">
                    {invitationText.guestGreeting.subtitle}
                  </p>
                  <h1 className="font-serif text-4xl md:text-5xl font-light text-[var(--primary)] mb-4">
                    {guest.name}
                  </h1>
                  <div className="h-px w-24 mx-auto bg-[var(--primary)]/30 my-8"></div>
                </div>
                
                <div className="max-w-4xl mx-auto space-y-4">
                  {sectionOrder.filter(s => s.enabled).map((section, index) => {
                    const enabledSections = sectionOrder.filter(s => s.enabled)
                    const isLastSection = index === enabledSections.length - 1

                    let SectionComponent: React.ReactNode = null

                    switch (section.key) {
                      case 'section_hero':
                        SectionComponent = <HeroSection {...sectionProps} />
                        break
                      case 'section_couple':
                        SectionComponent = <CoupleProfile {...sectionProps} />
                        break
                      case 'section_story':
                        SectionComponent = <LoveTimeline {...sectionProps} />
                        break
                      case 'section_venue':
                        SectionComponent = <EventDetails {...sectionProps} />
                        break
                      case 'section_gallery':
                        SectionComponent = <PhotoGallery />
                        break
                      case 'section_rsvp':
                        SectionComponent = <RsvpForm />
                        break
                      case 'section_gift':
                        SectionComponent = <GiftSection />
                        break
                      default:
                        return null
                    }

                    if (!SectionComponent) return null

                    return (
                      <div key={section.key}>
                        <AnimatedSection
                          sectionIndex={index}
                          enabled={animationEnabled}
                          id={section.key.replace('section_', '')}
                        >
                          {SectionComponent}
                        </AnimatedSection>
                        {!isLastSection && <SectionDivider />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </InviteTracker>
    )
  } catch (error) {
    console.error("Error loading invitation page:", error)
    notFound()
  }
}