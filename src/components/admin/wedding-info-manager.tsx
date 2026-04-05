"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Pencil, X, Upload, Image, Music, Video } from "lucide-react"
import { toast } from "sonner"
import { ZoomableDatePicker } from "@/components/ui/zoomable-date-picker"
import { TimeRangePicker } from "@/components/ui/time-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type WeddingConfig = Record<string, string>

interface ConfigSection {
  title: string
  fields: {
    key: string
    label: string
    placeholder?: string
    type?: "text" | "photo" | "audio"
  }[]
}

const configSections: ConfigSection[] = [
  {
    title: "Couple Photos",
    fields: [
      { key: "bride_photo_url", label: "Bride Photo", type: "photo" },
      { key: "groom_photo_url", label: "Groom Photo", type: "photo" },
    ],
  },
  {
    title: "Bride Information",
    fields: [
      { key: "bride_name", label: "Full Name", placeholder: "Flara Patricia" },
      { key: "bride_parents", label: "Parents", placeholder: "Bapak Nama Bapak & Ibu Nama Ibu" },
      { key: "bride_description", label: "Description", placeholder: "Putri Pertama Dari..." },
      { key: "bride_instagram", label: "Instagram", placeholder: "@flarapatricia" },
    ],
  },
  {
    title: "Groom Information",
    fields: [
      { key: "groom_name", label: "Full Name", placeholder: "Kelvin Gunawan" },
      { key: "groom_parents", label: "Parents", placeholder: "Bapak Nama Bapak & Ibu Nama Ibu" },
      { key: "groom_description", label: "Description", placeholder: "Putra Pertama Dari..." },
      { key: "groom_instagram", label: "Instagram", placeholder: "@kelvingunawan" },
    ],
  },
  {
    title: "Wedding Date & Time",
    fields: [
      { key: "wedding_date", label: "Wedding Date", placeholder: "2024-09-23" },
      { key: "ceremony_time", label: "Ceremony Time", placeholder: "08:00 - 10.00 WIB" },
      { key: "reception_time", label: "Reception Time", placeholder: "11:00 - 14:00 WIB" },
    ],
  },
  {
    title: "Venue Details",
    fields: [
      { key: "venue_name", label: "Venue Name", placeholder: "Vue Palace Hotel" },
      { key: "venue_address", label: "Venue Address", placeholder: "Jl. Otto Iskandar Dinata No.3..." },
      { key: "venue_maps_url", label: "Google Maps URL", placeholder: "https://maps.google.com/..." },
    ],
  },
  {
    title: "Love Story",
    fields: [
      { key: "story_meet", label: "How We Met", placeholder: "September 2021||Awal Bertemu||Description..." },
      { key: "story_relationship", label: "Start of Relationship", placeholder: "September 2022||Menjalin Hubungan||Description..." },
      { key: "story_engagement", label: "Engagement", placeholder: "September 2023||Bertunangan||Description..." },
      { key: "story_wedding", label: "Wedding Day", placeholder: "September 2024||Hari Pernikahan||Description..." },
    ],
  },
  {
    title: "Quotes",
    fields: [
      { key: "quote", label: "Quote", placeholder: "Dan di antara tanda-tanda kebesaran-Nya..." },
      { key: "quote_source", label: "Quote Source", placeholder: "QS. Ar-Rum: 21" },
    ],
  },
  {
    title: "Background Music",
    fields: [
      { key: "music_source_type", label: "Music Source", placeholder: "youtube or local" },
      { key: "bg_music_url", label: "Music URL / Upload", placeholder: "YouTube URL or leave empty to upload file", type: "audio" },
    ],
  },
  {
    title: "Cover Section",
    fields: [
      { key: "cover_video_type", label: "Video Source", placeholder: "youtube or local" },
      { key: "cover_video_url", label: "Video URL / Upload", placeholder: "YouTube URL or leave empty to upload file" },
      { key: "cover_video_opacity", label: "Video Opacity (%)", placeholder: "60" },
      { key: "cover_poster_url", label: "Poster Image", type: "photo" },
    ],
  },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return "Not set"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  } catch {
    return dateStr
  }
}

export function WeddingInfoManager() {
  const [config, setConfig] = useState<WeddingConfig>({})
  const [originalConfig, setOriginalConfig] = useState<WeddingConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<"photo" | "audio" | "video" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const currentPhotoKey = useRef<string | null>(null)

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from("wedding_config")
      .select("key, value")

    if (!error && data) {
      const configMap: WeddingConfig = {}
      data.forEach((item) => {
        configMap[item.key] = item.value
      })
      setConfig(configMap)
      setOriginalConfig(configMap)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handlePhotoClick = (key: string) => {
    currentPhotoKey.current = key
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentPhotoKey.current) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WebP, or GIF)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setUploading(currentPhotoKey.current)

    const fileExt = file.name.split('.').pop()
    const fileName = `${currentPhotoKey.current}-${Date.now()}.${fileExt}`
    const filePath = `couple-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('wedding-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('wedding-assets')
      .getPublicUrl(filePath)

    handleChange(currentPhotoKey.current, publicUrl)
    setUploading(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (key: string) => {
    handleChange(key, '')
  }

  const handleAudioClick = (key: string) => {
    currentPhotoKey.current = key
    audioInputRef.current?.click()
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentPhotoKey.current) return

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid audio file (MP3, WAV, or OGG)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Audio file must be less than 10MB")
      return
    }

    setUploading(currentPhotoKey.current)
    setUploadingType("audio")

    const fileExt = file.name.split('.').pop()
    const fileName = `${currentPhotoKey.current}-${Date.now()}.${fileExt}`
    const filePath = `music/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('wedding-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setUploading(null)
      setUploadingType(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('wedding-assets')
      .getPublicUrl(filePath)

    handleChange(currentPhotoKey.current, publicUrl)
    setUploading(null)
    setUploadingType(null)

    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  const handleVideoClick = (key: string) => {
    currentPhotoKey.current = key
    videoInputRef.current?.click()
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentPhotoKey.current) return

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid video file (MP4, WebM, or OGG)")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video file must be less than 50MB")
      return
    }

    setUploading(currentPhotoKey.current)
    setUploadingType("video")

    const fileExt = file.name.split('.').pop()
    const fileName = `${currentPhotoKey.current}-${Date.now()}.${fileExt}`
    const filePath = `cover/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('wedding-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setUploading(null)
      setUploadingType(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('wedding-assets')
      .getPublicUrl(filePath)

    handleChange('cover_video_type', 'local')
    handleChange('cover_video_url', publicUrl)
    setUploading(null)
    setUploadingType(null)

    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setConfig({ ...originalConfig })
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleSave = async () => {
    setSaving(true)

    const updates = Object.entries(config).map(([key, value]) => ({
      key,
      value,
    }))

    const { error } = await supabase
      .from("wedding_config")
      .upsert(updates, { onConflict: "key" })

    if (error) {
      console.error("Error saving config:", error.message, error.details, error.hint)
      toast.error(`Failed to save: ${error.message}`)
    } else {
      toast.success("Wedding information saved successfully!")
      setOriginalConfig({ ...config })
      setHasChanges(false)
      setIsEditing(false)
    }

    setSaving(false)
  }

  const renderField = (field: ConfigSection["fields"][0], value: string) => {
    if (field.type === "photo") {
      return (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          {value ? (
            <div className="relative group">
              <img
                src={value}
                alt={field.label}
                className="h-32 w-32 rounded-lg object-cover border"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePhotoClick(field.key)}
                  className="text-white hover:text-white hover:bg-white/20"
                  disabled={uploading === field.key || !isEditing}
                >
                  {uploading === field.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { handleChange(field.key, ''); if (field.key === 'cover_poster_url') {} }}
                  className="text-white hover:text-red-400 hover:bg-white/20 ml-1"
                  disabled={!isEditing}
                  title={isEditing ? "Remove" : "Click Edit to remove"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {!isEditing && (
                <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted-foreground bg-black/50 rounded-b-lg py-1">
                  Click Edit to modify
                </div>
              )}
            </div>
          ) : isEditing ? (
            <Button
              variant="outline"
              onClick={() => handlePhotoClick(field.key)}
              disabled={uploading === field.key}
              className="w-full h-32"
            >
              {uploading === field.key ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Image className="h-4 w-4 mr-2" />
              )}
              Upload {field.label}
            </Button>
          ) : (
            <div className="h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
              <span className="text-xs">No photo</span>
            </div>
          )}
        </div>
      )
    }

    if (field.type === "audio") {
      const musicType = config.music_source_type || ""
      
      if (!isEditing) {
        if (!value) {
          return (
            <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border">
              Not set
            </div>
          )
        }
        if (musicType === "local") {
          return (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Music className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm truncate flex-1">{value.split('/').pop()}</span>
            </div>
          )
        }
        return (
          <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border truncate">
            {value}
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
            className="hidden"
            onChange={handleAudioUpload}
          />
          {musicType === "local" ? (
            value ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Music className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Audio file uploaded</p>
                  <p className="text-xs text-muted-foreground truncate">{value.split('/').pop()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAudioClick(field.key)}
                    disabled={uploading === field.key && uploadingType === "audio"}
                  >
                    {uploading === field.key && uploadingType === "audio" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleChange(field.key, ''); handleChange('music_source_type', ''); }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleAudioClick(field.key)}
                disabled={uploading === field.key && uploadingType === "audio"}
                className="w-full"
              >
                {uploading === field.key && uploadingType === "audio" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Music className="h-4 w-4 mr-2" />
                )}
                Upload Audio
              </Button>
            )
          ) : musicType === "youtube" ? (
            <div className="space-y-2">
              <Input
                id={field.key}
                value={value || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="https://youtu.be/xxx or https://youtube.com/watch?v=xxx"
              />
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { handleChange(field.key, ''); handleChange('music_source_type', ''); }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Select music source first</span>
            </div>
          )}
        </div>
      )
    }

    if (!isEditing) {
      const displayValue = field.key === "wedding_date" 
        ? formatDate(value)
        : value || "Not set"
      
      return (
        <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border">
          {displayValue}
        </div>
      )
    }

    if (field.key === "wedding_date") {
      return (
        <ZoomableDatePicker
          value={value || ""}
          onChange={(val: string) => handleChange(field.key, val)}
        />
      )
    }

    if (field.key === "ceremony_time" || field.key === "reception_time") {
      return (
        <TimeRangePicker
          value={value || ""}
          onChange={(val: string) => handleChange(field.key, val)}
        />
      )
    }

    if (field.key === "cover_video_type") {
      if (!isEditing) {
        return (
          <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border">
            {value === "youtube" ? "YouTube" : value === "local" ? "Upload Video" : "Not set"}
          </div>
        )
      }
      return (
        <Select value={value || ""} onValueChange={(val) => handleChange(field.key, val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select video source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="local">Upload Video</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (field.key === "music_source_type") {
      if (!isEditing) {
        return (
          <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border">
            {value === "youtube" ? "YouTube" : value === "local" ? "Upload Audio" : "Not set"}
          </div>
        )
      }
      return (
        <Select value={value || ""} onValueChange={(val) => handleChange(field.key, val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select music source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="local">Upload Audio</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (field.key === "cover_video_url") {
      const videoType = config.cover_video_type || ""
      
      if (!isEditing) {
        if (!value) {
          return (
            <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border">
              Not set
            </div>
          )
        }
        if (videoType === "local") {
          return (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <video className="h-16 w-24 object-cover rounded" src={value} muted />
              <span className="text-sm truncate flex-1">{value.split('/').pop()}</span>
            </div>
          )
        }
        return (
          <div className="h-10 px-3 py-2 text-sm text-foreground bg-muted/30 rounded-md border truncate">
            {value}
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            className="hidden"
            onChange={handleVideoUpload}
          />
          {videoType === "local" ? (
            value ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <video className="h-16 w-24 object-cover rounded" src={value} muted />
                <div className="flex-1">
                  <p className="text-sm font-medium">Video uploaded</p>
                  <p className="text-xs text-muted-foreground truncate">{value.split('/').pop()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVideoClick(field.key)}
                    disabled={uploading === field.key && uploadingType === "video"}
                  >
                    {uploading === field.key && uploadingType === "video" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleChange(field.key, ''); handleChange('cover_video_type', ''); }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleVideoClick(field.key)}
                disabled={uploading === field.key && uploadingType === "video"}
                className="w-full h-20"
              >
                {uploading === field.key && uploadingType === "video" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Upload Video
              </Button>
            )
          ) : (
            <Input
              id={field.key}
              value={value || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder="https://youtu.be/xxx or https://youtube.com/watch?v=xxx"
            />
          )}
        </div>
      )
    }

    if (field.key === "cover_video_opacity") {
      return (
        <Input
          id={field.key}
          type="number"
          min={0}
          max={100}
          value={value || "60"}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder="60"
        />
      )
    }

    return (
      <Input
        id={field.key}
        value={value || ""}
        onChange={(e) => handleChange(field.key, e.target.value)}
        placeholder={field.placeholder}
      />
    )
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
          <h2 className="text-2xl font-bold">Wedding Information</h2>
          <p className="text-muted-foreground">
            {isEditing ? "Edit your wedding details" : "View and manage your wedding details"}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {configSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>
              {isEditing ? `Update ${section.title.toLowerCase()} details` : `${section.title} details`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.title === "Couple Photos" ? (
              <div className="flex gap-8 justify-center">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-2 flex flex-col items-center">
                    <Label>{field.label}</Label>
                    {renderField(field, config[field.key] || "")}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {renderField(field, config[field.key] || "")}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
