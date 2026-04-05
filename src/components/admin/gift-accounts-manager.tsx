"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Copy, Check, Building2 } from "lucide-react"
import { toast } from "sonner"

interface GiftAccount {
  id: string
  bank_name: string
  account_number: string
  account_name: string
  display_order: number
  created_at: string
}

export function GiftAccountsManager() {
  const [accounts, setAccounts] = useState<GiftAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_name: ""
  })

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("gift_accounts")
      .select("*")
      .order("display_order", { ascending: true })

    if (!error && data) {
      setAccounts(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.bank_name.trim() || !formData.account_number.trim() || !formData.account_name.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setSaving(true)

    const maxOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.display_order)) : 0

    if (editingId) {
      const { error } = await supabase
        .from("gift_accounts")
        .update({
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name
        })
        .eq("id", editingId)

      if (error) {
        toast.error(`Failed to update: ${error.message}`)
      } else {
        toast.success("Account updated successfully")
        resetForm()
        fetchAccounts()
      }
    } else {
      const { error } = await supabase
        .from("gift_accounts")
        .insert({
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name,
          display_order: maxOrder + 1
        })

      if (error) {
        toast.error(`Failed to add: ${error.message}`)
      } else {
        toast.success("Account added successfully")
        resetForm()
        fetchAccounts()
      }
    }

    setSaving(false)
  }

  const handleEdit = (account: GiftAccount) => {
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_name: account.account_name
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return

    const { error } = await supabase
      .from("gift_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error(`Failed to delete: ${error.message}`)
    } else {
      toast.success("Account deleted successfully")
      fetchAccounts()
    }
  }

  const resetForm = () => {
    setFormData({ bank_name: "", account_number: "", account_name: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Account number copied!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Amplop Digital</h2>
          <p className="text-muted-foreground">
            Kelola rekening bank untuk terima Amplop Digital
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#a18a55] hover:bg-[#8a7045]">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Rekening
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Rekening" : "Tambah Rekening Baru"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Nama Bank</Label>
                  <Input
                    id="bank_name"
                    placeholder="BCA, Mandiri, BRI, dll"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Nomor Rekening</Label>
                  <Input
                    id="account_number"
                    placeholder="1234567890"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_name">Nama Pemilik Rekening</Label>
                  <Input
                    id="account_name"
                    placeholder="FLARA PATRICIA"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="bg-[#a18a55] hover:bg-[#8a7045]">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {editingId ? "Simpan Perubahan" : "Tambah"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Daftar Rekening ({accounts.length})
        </h3>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Belum ada rekening. Tambahkan rekening pertama Anda di atas.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{account.bank_name}</p>
                      <p className="text-2xl font-bold text-[#a18a55] mt-2">
                        {account.account_number}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {account.account_name}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(account.account_number, account.id)}
                        title="Copy nomor rekening"
                      >
                        {copiedId === account.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(account)}
                        title="Edit"
                      >
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(account.id)}
                        title="Hapus"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
