"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/components/theme-provider'
import { getInvitationData } from '@/lib/services/invitation-service'
import AnimatedSection from '@/components/invitation/AnimatedSection'
import SectionDivider from '@/components/invitation/SectionDivider'

const CoverScreen = dynamic(() => import('@/sections/cover-screen'), { ssr: false })
const HeroSection = dynamic(() => import('@/sections/hero-section'), { ssr: false })
const CoupleProfile = dynamic(() => import('@/sections/couple-profile'), { ssr: false })
const LoveTimeline = dynamic(() => import('@/sections/love-timeline'), { ssr: false })
const EventDetails = dynamic(() => import('@/sections/event-details'), { ssr: false })
const PhotoGallery = dynamic(() => import('@/sections/photo-gallery'), { ssr: false })
const RsvpForm = dynamic(() => import('@/sections/rsvp-form'), { ssr: false })
const GiftSection = dynamic(() => import('@/sections/gift-section'), { ssr: false })

export default function PreviewPage() {
  const [isOpened, setIsOpened] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invitationData, setInvitationData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getInvitationData()
        setInvitationData(data)
      } catch (error) {
        console.error('Error loading preview:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load preview</p>
      </div>
    )
  }

  const sectionOrder = invitationData.sectionOrder || []
  const config = invitationData.config || {}
  const theme = invitationData.theme || {}
  const sectionProps = { data: config, theme }

  const handleOpen = () => setIsOpened(true)

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <CoverScreen 
          onOpen={handleOpen} 
          onPlayAudio={() => {}} 
          hasAudio={false}
        />

        {isOpened && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-4">
              {sectionOrder.filter((s: { enabled: boolean }) => s.enabled).map((section: { key: string; enabled: boolean }, index: number) => {
                const enabledSections = sectionOrder.filter((s: { enabled: boolean }) => s.enabled)
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
                      enabled={true}
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
        )}
      </div>
    </ThemeProvider>
  )
}