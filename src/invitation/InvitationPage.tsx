"use client"

import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SectionProps } from "@/types/section"

interface InvitationPageProps {
  children: ReactNode
  data?: Record<string, any>
  guest?: SectionProps['guest']
  theme?: SectionProps['theme']
}

export default function InvitationPage({ 
  children, 
  data = {},
  guest,
  theme 
}: InvitationPageProps) {
  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ThemeProvider>
  )
}
