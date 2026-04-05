"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, GripVertical, Palette, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { extractFirstName } from "@/lib/utils/section-adapter"

type ThemePreset = "default" | "rose" | "sage" | "navy" | "burgundy" | "gold" | "forest" | "twilight"

interface SectionToggle {
  key: string
  label: string
  enabled: boolean
  displayOrder: number
}

const THEME_PRESETS: Record<ThemePreset, { primary: string; secondary: string; accent: string; background: string }> = {
  default: { primary: "#a18a55", secondary: "#8b7355", accent: "#d4af37", background: "#fafafa" },
  rose: { primary: "#c9a4a4", secondary: "#a67c7c", accent: "#e8c4c4", background: "#fdf5f5" },
  sage: { primary: "#8da399", secondary: "#6b8076", accent: "#b5c4b9", background: "#f5f8f6" },
  navy: { primary: "#2c3e50", secondary: "#1a252f", accent: "#34495e", background: "#f8f9fa" },
  burgundy: { primary: "#722f37", secondary: "#4a1f24", accent: "#943a42", background: "#fdf8f8" },
  gold: { primary: "#c9a227", secondary: "#8b6914", accent: "#e6c552", background: "#fdfbf0" },
  forest: { primary: "#2d5a3d", secondary: "#1e3d29", accent: "#4a7c59", background: "#f4f8f5" },
  twilight: { primary: "#4a4063", secondary: "#2e2840", accent: "#6b5b8c", background: "#f5f4f8" },
}

const THEME_OPTIONS: { value: ThemePreset; label: string }[] = [
  { value: "default", label: "Classic Gold" },
  { value: "rose", label: "Rose" },
  { value: "sage", label: "Sage" },
  { value: "navy", label: "Navy" },
  { value: "burgundy", label: "Burgundy" },
  { value: "gold", label: "Gold" },
  { value: "forest", label: "Forest" },
  { value: "twilight", label: "Twilight" },
]

const defaultSections: SectionToggle[] = [
  { key: "section_venue", label: "Venue & Date", enabled: true, displayOrder: 7 },
  { key: "section_hero", label: "Hero Section", enabled: true, displayOrder: 1 },
  { key: "section_couple", label: "Couple Profile", enabled: true, displayOrder: 2 },
  { key: "section_story", label: "Love Story", enabled: true, displayOrder: 3 },
  { key: "section_gallery", label: "Photo Gallery", enabled: true, displayOrder: 4 },
  { key: "section_rsvp", label: "RSVP Form", enabled: true, displayOrder: 5 },
  { key: "section_gift", label: "Gift Section", enabled: true, displayOrder: 6 },
]

function SortableSectionItem({
  section,
  onToggle,
}: {
  section: SectionToggle
  onToggle: (key: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-background"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <Label htmlFor={section.key} className="cursor-pointer font-medium">
          {section.label}
        </Label>
      </div>
      <Switch
        id={section.key}
        checked={section.enabled}
        onCheckedChange={() => onToggle(section.key)}
      />
    </div>
  )
}

export function SettingsManager() {
  const [domain, setDomain] = useState("")
  const [sections, setSections] = useState<SectionToggle[]>(defaultSections)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [fullPageVideo, setFullPageVideo] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [themePreset, setThemePreset] = useState<ThemePreset>("default")
  const [customPrimary, setCustomPrimary] = useState("")
  const [customSecondary, setCustomSecondary] = useState("")
  const [customAccent, setCustomAccent] = useState("")
  const [customBackground, setCustomBackground] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [whatsappTemplate, setWhatsappTemplate] = useState("")
  const [whatsappPreview, setWhatsappPreview] = useState("")

  const DEFAULT_WHATSAPP_TEMPLATE = JSON.stringify([
    {
      id: "v1",
      text: "Kepada Yth. {{guest_name}}\n\nDengan penuh kebahagiaan kami mengundang Anda untuk menghadiri pernikahan {{bride_name}} & {{groom_name}}.\n\n📅 {{wedding_date}}\n📍 {{venue_name}}\n\nBuka undangan: {{invite_link}}\n\nHormat kami,\n{{bride_name}} & {{groom_name}}"
    },
    {
      id: "v2",
      text: "Yth. {{guest_name}}\n\nMerupakan kebahagiaan bagi kami mengundang Anda di acara pernikahan {{bride_name}} & {{groom_name}}.\n\n🗓️ {{wedding_date}}\n🏠 {{venue_name}}\n\nSilakan klik: {{invite_link}}\n\nTerima kasih atas doa restunya.\n{{bride_name}} & {{groom_name}}"
    },
    {
      id: "v3",
      text: "Assalamu'alaikum Wr. Wb.\n\nDengan hormat,\nKami ingin mengundang {{guest_name}} menghadiri acara pernikahan {{bride_name}} & {{groom_name}}.\n\n📆 {{wedding_date}}\n📍 {{venue_name}}\n\n{{invite_link}}\n\nWassalamu'alaikum Wr. Wb.\n{{bride_name}} & {{groom_name}}"
    }
  ], null, 2)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("wedding_config")
        .select("key, value, display_order")

      if (data) {
        const domainSetting = data.find((d) => d.key === "wedding_domain")
        if (domainSetting) setDomain(domainSetting.value)

        const musicSetting = data.find((d) => d.key === "section_music")
        if (musicSetting) setMusicEnabled(musicSetting.value === "true")

        const fullPageVideoSetting = data.find((d) => d.key === "full_page_video")
        if (fullPageVideoSetting) setFullPageVideo(fullPageVideoSetting.value === "true")

        const animationsSetting = data.find((d) => d.key === "animations_enabled")
        if (animationsSetting) setAnimationsEnabled(animationsSetting.value === "true")
        else setAnimationsEnabled(true) // Default to true if not set

        const themePresetSetting = data.find((d) => d.key === "theme_preset")
        if (themePresetSetting) setThemePreset(themePresetSetting.value as ThemePreset)

        const primarySetting = data.find((d) => d.key === "primary_color")
        if (primarySetting) setCustomPrimary(primarySetting.value)

        const secondarySetting = data.find((d) => d.key === "secondary_color")
        if (secondarySetting) setCustomSecondary(secondarySetting.value)

        const accentSetting = data.find((d) => d.key === "accent_color")
        if (accentSetting) setCustomAccent(accentSetting.value)

        const bgSetting = data.find((d) => d.key === "bg_color")
        if (bgSetting) setCustomBackground(bgSetting.value)

        setSections((prev) =>
          prev.map((section) => {
            const config = data.find((d) => d.key === section.key)
            return {
              ...section,
              enabled: config?.value === "true",
              displayOrder: config?.display_order ?? section.displayOrder,
            }
          }).sort((a, b) => a.displayOrder - b.displayOrder)
        )
      }
      setLoading(false)
    }

    fetchSettings()
  }, [])

  const handleSectionToggle = (key: string) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id)
        const newIndex = items.findIndex((item) => item.key === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update displayOrder based on new positions
        return newItems.map((item, index) => ({
          ...item,
          displayOrder: index + 1,
        }))
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)

    const updates = [
      { key: "wedding_domain", value: domain },
      { key: "section_music", value: musicEnabled.toString(), display_order: 0 },
      { key: "full_page_video", value: fullPageVideo.toString(), display_order: 0 },
      { key: "animations_enabled", value: animationsEnabled.toString(), display_order: 0 },
      { key: "theme_preset", value: themePreset, display_order: 0 },
      { key: "primary_color", value: customPrimary || THEME_PRESETS[themePreset].primary, display_order: 0 },
      { key: "secondary_color", value: customSecondary || THEME_PRESETS[themePreset].secondary, display_order: 0 },
      { key: "accent_color", value: customAccent || THEME_PRESETS[themePreset].accent, display_order: 0 },
      { key: "bg_color", value: customBackground || THEME_PRESETS[themePreset].background, display_order: 0 },
      ...sections.map((s) => ({ 
        key: s.key, 
        value: s.enabled.toString(),
        display_order: s.displayOrder,
      })),
    ]

    const { error } = await supabase.from("wedding_config").upsert(updates, { onConflict: "key" })

    if (error) {
      toast.error("Failed to save settings: " + error.message)
    } else {
      toast.success("Settings saved successfully")
    }

    setSaving(false)
  }

  const saveWhatsappTemplate = async () => {
    setSaving(true)
    try {
      JSON.parse(whatsappTemplate)
    } catch {
      toast.error("Invalid JSON format")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("wedding_config")
      .upsert({ key: "whatsapp_template_variations", value: whatsappTemplate }, { onConflict: "key" })

    if (error) {
      toast.error("Failed to save template: " + error.message)
    } else {
      toast.success("WhatsApp template saved")
      updateWhatsappPreview()
    }
    setSaving(false)
  }

  const resetWhatsappTemplate = () => {
    setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE)
    updateWhatsappPreview()
  }

  const updateWhatsappPreview = () => {
    try {
      const variations = JSON.parse(whatsappTemplate)
      if (variations.length > 0) {
        const random = variations[Math.floor(Math.random() * variations.length)]
        const preview = random.text
          .replace(/{{guest_name}}/g, "Budi Santoso")
          .replace(/{{bride_name}}/g, extractFirstName('Flara'))
          .replace(/{{groom_name}}/g, extractFirstName('Kelvin'))
          .replace(/{{wedding_date}}/g, "15 Maret 2026")
          .replace(/{{venue_name}}/g, "Vue Palace Hotel")
          .replace(/{{invite_link}}/g, "https://example.com/invite/xxx")
        setWhatsappPreview(preview)
      }
    } catch {
      setWhatsappPreview("")
    }
  }

  useEffect(() => {
    if (whatsappTemplate) {
      updateWhatsappPreview()
    }
  }, [whatsappTemplate])

  useEffect(() => {
    const fetchWhatsappTemplate = async () => {
      const { data } = await supabase
        .from("wedding_config")
        .select("value")
        .eq("key", "whatsapp_template_variations")
        .single()
      
      if (data?.value) {
        setWhatsappTemplate(data.value)
      } else {
        setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE)
      }
    }
    fetchWhatsappTemplate()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="sticky top-0 z-10 bg-background py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-muted-foreground">Configure your wedding site</p>
          </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Configuration</CardTitle>
          <CardDescription>General settings for your wedding website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Wedding Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://your-wedding-domain.com"
            />
            <p className="text-xs text-muted-foreground">
              This domain will be used when generating guest invite links
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Toggles</CardTitle>
          <CardDescription>Enable, disable, and reorder sections on your invitation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.key}
                    section={section}
                    onToggle={handleSectionToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-xs text-muted-foreground">
            Drag the grip icon to reorder sections. The order will be reflected on the invitation page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background Music</CardTitle>
          <CardDescription>Enable or disable background music on your invitation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="section_music" className="cursor-pointer font-medium">
              Background Music
            </Label>
            <Switch
              id="section_music"
              checked={musicEnabled}
              onCheckedChange={setMusicEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Background</CardTitle>
          <CardDescription>Show video background across all pages (requires video to be set in Wedding Info)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="full_page_video" className="cursor-pointer font-medium">
              Full Page Video
            </Label>
            <Switch
              id="full_page_video"
              checked={fullPageVideo}
              onCheckedChange={setFullPageVideo}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Animations
          </CardTitle>
          <CardDescription>Enable or disable page animations for sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="animations_enabled" className="cursor-pointer font-medium">
              Enable Animations
            </Label>
            <Switch
              id="animations_enabled"
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            WhatsApp Message Template
          </CardTitle>
          <CardDescription>
            Customize invitation message. Placeholders: {'{{guest_name}}'}, {'{{bride_name}}'}, {'{{groom_name}}'}, {'{{wedding_date}}'}, {'{{venue_name}}'}, {'{{invite_link}}'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template Variations (JSON)</Label>
            <textarea
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full h-64 p-3 text-sm font-mono border rounded-lg resize-y"
              placeholder='[{"id": "v1", "text": "Your message..."}]'
            />
            <p className="text-xs text-muted-foreground">
              Add multiple variations to avoid WhatsApp spam detection. System randomly selects one.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Preview (Random Variation)</Label>
            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
              {whatsappPreview || "Add a valid JSON template to see preview..."}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveWhatsappTemplate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
            <Button variant="outline" onClick={resetWhatsappTemplate}>
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Colors
          </CardTitle>
          <CardDescription>Choose a color preset or customize your own theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme Preset</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => {
                    setThemePreset(theme.value)
                    setCustomPrimary("")
                    setCustomSecondary("")
                    setCustomAccent("")
                    setCustomBackground("")
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    themePreset === theme.value
                      ? "border-black dark:border-white bg-accent/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div
                    className="h-6 w-full rounded mb-2"
                    style={{ backgroundColor: THEME_PRESETS[theme.value].primary }}
                  />
                  <span className="text-xs font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Custom Colors (optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimary || THEME_PRESETS[themePreset].primary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={customPrimary || THEME_PRESETS[themePreset].primary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    placeholder="#a18a55"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Secondary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSecondary || THEME_PRESETS[themePreset].secondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={customSecondary || THEME_PRESETS[themePreset].secondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    placeholder="#8b7355"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customAccent || THEME_PRESETS[themePreset].accent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={customAccent || THEME_PRESETS[themePreset].accent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder="#d4af37"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customBackground || THEME_PRESETS[themePreset].background}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={customBackground || THEME_PRESETS[themePreset].background}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    placeholder="#fafafa"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: customBackground || THEME_PRESETS[themePreset].background }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: customPrimary || THEME_PRESETS[themePreset].primary,
                    color: "#fff",
                  }}
                >
                  Primary Button
                </div>
                <div
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: customAccent || THEME_PRESETS[themePreset].accent,
                    color: "#000",
                  }}
                >
                  Accent
                </div>
                <div
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: customSecondary || THEME_PRESETS[themePreset].secondary,
                    color: "#fff",
                  }}
                >
                  Secondary
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
