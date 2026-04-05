"use client"

import { useState } from "react"
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
import { Plus, Loader2 } from "lucide-react"

interface AddGuestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestAdded: () => void
}

const categories = ["family", "friends", "colleagues", "vip"]

export function AddGuestDialog({ open, onOpenChange, onGuestAdded }: AddGuestDialogProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [category, setCategory] = useState("family")
  const [pax, setPax] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const slug = generateSlug(name)

    const { error } = await supabase.from("guests").insert({
      name: name.trim(),
      slug,
      phone: phone.trim() || null,
      category,
      pax,
      rsvp_status: "pending",
    })

    setLoading(false)

    if (error) {
      console.error("Error adding guest:", error)
      alert("Failed to add guest. Please try again.")
    } else {
      setName("")
      setPhone("")
      setCategory("family")
      setPax(1)
      onGuestAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Guest</DialogTitle>
          <DialogDescription>
            Add a new guest to your wedding list. An invitation link will be generated.
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
                placeholder="+628123456789"
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
              <Label htmlFor="pax" className="text-right">
                Pax
              </Label>
              <Input
                id="pax"
                type="number"
                min={1}
                max={10}
                value={pax}
                onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Guest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
