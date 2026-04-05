"use client"

import { useState, useEffect } from "react"
import { Guest } from "@/types/database"
import { generateInvitationUrl, copyToClipboard, DEFAULT_WEDDING_DOMAIN } from "@/lib/utils/index"
import { buildInviteMessage } from "@/lib/buildMessage"
import { buildWhatsAppLink } from "@/lib/buildWhatsAppLink"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditGuestDialog } from "./edit-guest-dialog"
import { Copy, Check, Loader2, MoreHorizontal, Trash2, UserCheck, UserX, MessageCircle, Link } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface GuestTableProps {
  guests: Guest[]
  loading: boolean
  onGuestUpdated: () => void
  selectedGuests: string[]
  onSelectionChange: (selected: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onBulkUpdateStatus: (ids: string[], status: 'pending' | 'confirmed' | 'declined') => void
  onBulkUpdateCategory: (ids: string[], category: string) => void
}

const rsvpLabels: Record<string, string> = {
  confirmed: "I will be there!",
  declined: "Cannot attend.",
  pending: "Pending",
}

const categoryColors: Record<string, string> = {
  family: "bg-blue-500",
  friends: "bg-green-500",
  colleagues: "bg-yellow-500",
  vip: "bg-purple-500",
}

export function GuestTable({ 
  guests, 
  loading, 
  onGuestUpdated,
  selectedGuests,
  onSelectionChange,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkUpdateCategory,
}: GuestTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [weddingDomain, setWeddingDomain] = useState(DEFAULT_WEDDING_DOMAIN)
  const [weddingConfig, setWeddingConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchDomain = async () => {
      const { data } = await supabase
        .from("wedding_config")
        .select("value")
        .eq("key", "wedding_domain")
        .single()
      if (data?.value) setWeddingDomain(data.value)
    }
    fetchDomain()
  }, [])

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("wedding_config")
        .select("key, value")
      
      if (data) {
        const config: Record<string, string> = {}
        data.forEach((item) => {
          config[item.key] = item.value
        })
        setWeddingConfig(config)
      }
    }
    fetchConfig()
  }, [])

  const allSelected = guests.length > 0 && selectedGuests.length === guests.length
  const someSelected = selectedGuests.length > 0 && selectedGuests.length < guests.length
  const checkboxState: boolean | "indeterminate" = allSelected ? true : someSelected ? "indeterminate" : false

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(guests.map(g => g.id))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedGuests.includes(id)) {
      onSelectionChange(selectedGuests.filter(gid => gid !== id))
    } else {
      onSelectionChange([...selectedGuests, id])
    }
  }

  const handleCopyUrl = async (guest: Guest) => {
    const url = generateInvitationUrl(guest.slug, weddingDomain)
    await copyToClipboard(url)
    setCopiedId(guest.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyMessage = async (guest: Guest) => {
    const inviteLink = generateInvitationUrl(guest.slug, weddingDomain)
    const message = await buildInviteMessage(guest.name, inviteLink, weddingConfig)
    await copyToClipboard(message)
    setCopiedMessageId(guest.id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleSendWhatsApp = async (guest: Guest) => {
    if (!guest.phone) {
      alert("Guest has no phone number")
      return
    }
    const inviteLink = generateInvitationUrl(guest.slug, weddingDomain)
    const message = await buildInviteMessage(guest.name, inviteLink, weddingConfig)
    const waLink = buildWhatsAppLink(guest.phone, message)
    window.open(waLink, "_blank")
  }

  const handleRsvpUpdate = async (guestId: string, status: "confirmed" | "declined") => {
    setUpdatingId(guestId)
    const { error } = await supabase
      .from("guests")
      .update({ rsvp_status: status })
      .eq("id", guestId)

    if (!error) {
      onGuestUpdated()
    }
    setUpdatingId(null)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (guests.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No guests yet. Click "Add Guest" to get started.
      </div>
    )
  }

  return (
    <div>
      {selectedGuests.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedGuests.length} guest{selectedGuests.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(selectedGuests, 'family')}>
                  Family
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(selectedGuests, 'friends')}>
                  Friends
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(selectedGuests, 'colleagues')}>
                  Colleagues
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateCategory(selectedGuests, 'vip')}>
                  VIP
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkUpdateStatus(selectedGuests, 'confirmed')}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Mark Confirmed
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkUpdateStatus(selectedGuests, 'pending')}
            >
              <Loader2 className="h-4 w-4 mr-1" />
              Mark Pending
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkUpdateStatus(selectedGuests, 'declined')}
            >
              <UserX className="h-4 w-4 mr-1" />
              Mark Declined
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedGuests.length} guest(s)?`)) {
                  onBulkDelete(selectedGuests)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={checkboxState}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RSVP Status</TableHead>
            <TableHead>Pax</TableHead>
            <TableHead>Wish</TableHead>
            <TableHead>Invitation Link</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <TableRow key={guest.id} data-selected={selectedGuests.includes(guest.id)}>
              <TableCell>
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => handleSelectOne(guest.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{guest.name}</TableCell>
              <TableCell>{guest.phone || '-'}</TableCell>
              <TableCell>
                <Badge className={categoryColors[guest.category] || "bg-gray-500"}>
                  {guest.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      guest.rsvp_status === "confirmed"
                        ? "default"
                        : guest.rsvp_status === "declined"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {rsvpLabels[guest.rsvp_status] || guest.rsvp_status}
                  </Badge>
                  {updatingId === guest.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </TableCell>
              <TableCell>{guest.rsvp_status === 'declined' ? '-' : guest.pax}</TableCell>
              <TableCell className="max-w-[200px]">
                {(guest as any).latest_wish ? (
                  <span className="text-sm text-muted-foreground" title={(guest as any).latest_wish}>
                    {truncateText((guest as any).latest_wish, 40)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(guest)}
                  className="text-xs"
                >
                  {copiedId === guest.id ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copiedId === guest.id ? "Copied!" : truncateText(`${weddingDomain}/?slug=${guest.slug}`, 25)}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyMessage(guest)}
                    className="h-8 px-2"
                    title="Copy invitation message"
                  >
                    {copiedMessageId === guest.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWhatsApp(guest)}
                    className="h-8 px-2 bg-green-50 hover:bg-green-100 border-green-200"
                    title="Send via WhatsApp"
                    disabled={!guest.phone}
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </Button>
                  {guest.rsvp_status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRsvpUpdate(guest.id, "confirmed")}
                        disabled={!!updatingId}
                        className="h-8"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRsvpUpdate(guest.id, "declined")}
                        disabled={!!updatingId}
                        className="h-8"
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  <EditGuestDialog guest={guest} onGuestUpdated={onGuestUpdated} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
