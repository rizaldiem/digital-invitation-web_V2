"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { generateSlug } from "@/lib/utils/index"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Loader2 } from "lucide-react"
import { Guest } from "@/types/database"

interface EditGuestDialogProps {
  guest: Guest
  onGuestUpdated: () => void
}

const categories = ["family", "friends", "colleagues", "vip"]
const rsvpStatuses = ["pending", "confirmed", "declined"]

export function EditGuestDialog({ guest, onGuestUpdated }: EditGuestDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(guest.name)
  const [phone, setPhone] = useState(guest.phone || "")
  const [category, setCategory] = useState(guest.category)
  const [rsvpStatus, setRsvpStatus] = useState<string>(guest.rsvp_status)
  const [pax, setPax] = useState(guest.pax)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(guest.name)
      setPhone(guest.phone || "")
      setCategory(guest.category)
      setRsvpStatus(guest.rsvp_status as string)
      setPax(guest.pax)
    }
  }, [open, guest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    const updates: Partial<Guest> = {
      name: name.trim(),
      phone: phone.trim() || null,
      category,
      rsvp_status: rsvpStatus as 'pending' | 'confirmed' | 'declined',
      pax: rsvpStatus === 'confirmed' ? pax : 0,
    }

    if (name.trim() !== guest.name) {
      updates.slug = generateSlug(name.trim())
    }

    const { error } = await supabase
      .from("guests")
      .update(updates)
      .eq("id", guest.id)

    setLoading(false)

    if (error) {
      console.error("Error updating guest:", error)
      alert("Failed to update guest. Please try again.")
    } else {
      onGuestUpdated()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
          <DialogDescription>
            Update guest information for {guest.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter guest name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rsvpStatus" className="text-right">
                Status
              </Label>
              <Select value={rsvpStatus} onValueChange={setRsvpStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {rsvpStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pax" className="text-right">
                Pax
              </Label>
              <Input
                id="pax"
                type="number"
                min={0}
                max={10}
                value={pax}
                onChange={(e) => setPax(parseInt(e.target.value) || 0)}
                className="col-span-3"
                disabled={rsvpStatus === "declined"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
