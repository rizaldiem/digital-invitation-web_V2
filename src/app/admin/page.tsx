"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Guest } from "@/types/database"
import { GuestTable } from "@/components/admin/guest-table"
import { AddGuestDialog } from "@/components/admin/add-guest-dialog"
import { CsvImportDialog } from "@/components/admin/csv-import-dialog"
import { GalleryManager } from "@/components/admin/gallery-manager"
import { GiftAccountsManager } from "@/components/admin/gift-accounts-manager"
import { WeddingInfoManager } from "@/components/admin/wedding-info-manager"
import { SettingsManager } from "@/components/admin/settings-manager"
import { TabNavigation } from "@/components/admin/tab-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportGuestsToCSV } from "@/lib/csv-import"

function AdminContent() {
  const [activeTab, setActiveTab] = useState<"guests" | "gallery" | "wedding-info" | "amplop" | "settings">("guests")
  const [galleryKey, setGalleryKey] = useState(0)
  const router = useRouter()
  
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])

  const handleGalleryUpdated = useCallback(() => {
    // Force gallery to remount by changing key
    setGalleryKey(k => k + 1)
  }, [])

  const fetchGuests = useCallback(async () => {
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false })

    if (guestsError) {
      console.error("Error fetching guests:", guestsError)
      setGuests([])
      setLoading(false)
      return
    }

    const { data: wishesData } = await supabase
      .from("wishes")
      .select("name, message")
      .order("created_at", { ascending: false })

    const latestWishes: Record<string, string> = {}
    if (wishesData) {
      wishesData.forEach((wish) => {
        if (!latestWishes[wish.name]) {
          latestWishes[wish.name] = wish.message
        }
      })
    }

    const guestsWithWishes = (guestsData || []).map((guest) => ({
      ...guest,
      latest_wish: latestWishes[guest.name] || null,
    }))

    setGuests(guestsWithWishes)
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true

    const loadGuests = async () => {
      const { data: guestsData, error: guestsError } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (guestsError) {
        console.error("Error fetching guests:", guestsError)
        setGuests([])
        setLoading(false)
        return
      }

      const { data: wishesData } = await supabase
        .from("wishes")
        .select("name, message")
        .order("created_at", { ascending: false })

      const latestWishes: Record<string, string> = {}
      if (wishesData) {
        wishesData.forEach((wish) => {
          if (!latestWishes[wish.name]) {
            latestWishes[wish.name] = wish.message
          }
        })
      }

      const guestsWithWishes = (guestsData || []).map((guest) => ({
        ...guest,
        latest_wish: latestWishes[guest.name] || null,
      }))

      setGuests(guestsWithWishes)
      setLoading(false)
    }

    loadGuests()

    const channel = supabase
      .channel('admin-guests-realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'guests' 
      }, (payload) => {
        setGuests(prev => prev.map(g => 
          g.id === payload.new.id ? { ...g, ...payload.new } : g
        ))
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const handleGuestAdded = () => {
    fetchGuests()
    setOpen(false)
  }

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase
      .from("guests")
      .delete()
      .in("id", ids)

    if (!error) {
      setSelectedGuests([])
      fetchGuests()
    } else {
      console.error("Error deleting guests:", error)
      alert("Failed to delete guests. Please try again.")
    }
  }

  const handleBulkUpdateStatus = async (ids: string[], status: 'pending' | 'confirmed' | 'declined') => {
    const { error } = await supabase
      .from("guests")
      .update({ 
        rsvp_status: status, 
        pax: status === 'confirmed' ? 1 : status === 'declined' ? 0 : 1 
      })
      .in("id", ids)

    if (!error) {
      setSelectedGuests([])
      fetchGuests()
    } else {
      console.error("Error updating status:", error)
      alert("Failed to update status. Please try again.")
    }
  }

  const handleBulkUpdateCategory = async (ids: string[], category: string) => {
    const { error } = await supabase
      .from("guests")
      .update({ category })
      .in("id", ids)

    if (!error) {
      setSelectedGuests([])
      fetchGuests()
    } else {
      console.error("Error updating category:", error)
      alert("Failed to update category. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>Manage your wedding guests and gallery</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>

        {activeTab === "guests" && (
          <>
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => exportGuestsToCSV(guests)}>
                <Download className="h-4 w-4 mr-2" />
                Unduh Daftar Tamu
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Impor CSV
              </Button>
              <AddGuestDialog open={open} onOpenChange={setOpen} onGuestAdded={handleGuestAdded} />
              <CsvImportDialog 
                open={importOpen} 
                onOpenChange={setImportOpen} 
                onImportComplete={fetchGuests}
              />
            </div>
            <GuestTable 
              guests={guests} 
              loading={loading} 
              onGuestUpdated={fetchGuests}
              selectedGuests={selectedGuests}
              onSelectionChange={setSelectedGuests}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkUpdateCategory={handleBulkUpdateCategory}
            />
          </>
        )}

        {activeTab === "gallery" && (
          <GalleryManager key={`gallery-${galleryKey}`} onGalleryUpdated={handleGalleryUpdated} />
        )}

        {activeTab === "amplop" && (
          <GiftAccountsManager />
        )}

        {activeTab === "wedding-info" && (
          <WeddingInfoManager />
        )}

        {activeTab === "settings" && (
          <SettingsManager />
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <AdminContent />
      </Suspense>
    </div>
  )
}
