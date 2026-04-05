"use client"

import { Users, Image, Heart, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils/index"

interface TabNavigationProps {
  activeTab: "guests" | "gallery" | "wedding-info" | "amplop" | "settings"
  onTabChange: (tab: "guests" | "gallery" | "wedding-info" | "amplop" | "settings") => void
}

const tabs = [
  { id: "guests" as const, label: "Guests", icon: Users },
  { id: "wedding-info" as const, label: "Wedding Info", icon: Heart },
  { id: "gallery" as const, label: "Gallery", icon: Image },
  { id: "amplop" as const, label: "Amplop Digital", icon: Wallet },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex space-x-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
