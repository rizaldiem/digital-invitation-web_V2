"use client"

import { useEffect, useState } from "react"

interface InviteTrackerProps {
  slug: string
  children: React.ReactNode
}

export function InviteTracker({ slug, children }: InviteTrackerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!slug || !mounted) return

    const trackOpen = async () => {
      try {
        await fetch("/api/invite-open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        })
      } catch (error) {
        console.error("Failed to track invite open:", error)
      }
    }

    trackOpen()
  }, [slug, mounted])

  return <>{children}</>
}
