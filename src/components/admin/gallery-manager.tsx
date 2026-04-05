"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { GalleryItem } from "@/types/database"
import { Button } from "@/components/ui/button"
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
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Upload, Loader2, Trash2, GripVertical, Image as ImageIcon, X, CloudUpload } from "lucide-react"
import { toast } from "sonner"

interface GalleryManagerProps {
  onGalleryUpdated?: () => void
}

function SortableImage({ item, onDelete }: { item: GalleryItem; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasValidUrl = item.url && item.url.trim() !== "" && item.url.startsWith("http")

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(true)
    setImageError(true)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden border bg-white"
    >
      <div className="aspect-square relative">
        {!hasValidUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mt-2">No URL</p>
          </div>
        ) : imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mt-2">Failed to load</p>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <img
              src={item.url}
              alt={item.caption || "Gallery image"}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      {item.caption && (
        <div className="p-2 text-sm text-muted-foreground truncate">
          {item.caption}
        </div>
      )}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon-sm"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function GalleryManager({ onGalleryUpdated }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchGallery = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      // Add timestamp to URL to prevent any caching
      const cacheBust = `_=${Date.now()}_${Math.random().toString(36).substring(7)}`
      const response = await fetch(`/api/gallery?${cacheBust}`, {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server')
      }

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch')
      }
      
      console.log("Fetched gallery items:", result.data?.length || 0, result.data?.map((d: any) => d.id))
      setItems(result.data || [])
    } catch (error: any) {
      console.error("Error fetching gallery:", error)
      toast.error("Gagal memuat galeri")
      setItems([])
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  const handleRefresh = () => {
    fetchGallery(true)
    toast.success("Galeri diperbarui")
  }

  useEffect(() => {
    // Clear items first to prevent stale data showing
    setItems([])
    // Then fetch fresh data
    fetchGallery()
  }, []) // Empty deps = only runs on mount

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 10) {
      toast.error("Maximum 10 files allowed per upload")
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type))
    
    if (validFiles.length !== selectedFiles.length) {
      toast.error("Some files were skipped (invalid file type)")
    }

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("wedding-gallery")
        .upload(fileName, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        toast.error(`Failed to upload ${file.name}`)
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
        continue
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))

      const { data: { publicUrl } } = supabase.storage
        .from("wedding-gallery")
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from("gallery")
        .insert({
          url: publicUrl,
          caption: null,
          display_order: maxOrder + 1 + i,
        })

      if (insertError) {
        console.error("Insert error:", insertError)
        toast.error(`Failed to save ${file.name} to gallery`)
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
    }

    setSelectedFiles([])
    setUploadProgress({})
    fetchGallery()
    onGalleryUpdated?.()
    setUploading(false)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const currentCount = selectedFiles.length
    if (currentCount + validFiles.length > 10) {
      toast.error("Maximum 10 files allowed. Some files were skipped.")
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10 - currentCount))
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return

    const item = items.find(i => i.id === id)
    if (!item) {
      toast.error("Item not found")
      return
    }

    // Optimistic update - immediately remove from UI
    const previousItems = [...items]
    setItems(prev => prev.filter(i => i.id !== id))

    try {
      // Use API route to bypass RLS
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        cache: 'no-store'
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed')
      }

      toast.success("Foto berhasil dihapus")
    } catch (error: any) {
      console.error("Delete error:", error)
      // Rollback optimistic update
      setItems(previousItems)
      toast.error(error.message || "Gagal menghapus foto")
      return
    }

    fetchGallery()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from("gallery")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
      }
    }
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
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Upload Images</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-[#a18a55] bg-[#a18a55]/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="bulk-upload"
          />
          <label htmlFor="bulk-upload" className="cursor-pointer">
            <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              Drag and drop images here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            Max 10 files, 5MB each. JPG, PNG, WebP, GIF
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedFiles.length} file(s) selected
              </p>
              <Button
                onClick={handleBulkUpload}
                disabled={uploading}
                className="bg-[#a18a55] hover:bg-[#8a7045]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload All ({selectedFiles.length})
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {uploadProgress[file.name] !== undefined && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {uploadProgress[file.name] === -1 ? (
                          <X className="h-8 w-8 text-red-500" />
                        ) : uploadProgress[file.name] === 100 ? (
                          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        )}
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <p className="text-xs truncate mt-1 text-muted-foreground">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Gallery ({items.length} images)
          </h3>
          {items.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm(`Hapus SEMUA ${items.length} foto? Tindakan ini tidak bisa diundo!`)) return
                
                setItems([]) // Clear UI immediately
                
                try {
                  const response = await fetch('/api/gallery/delete-all', {
                    method: 'DELETE',
                    cache: 'no-store'
                  })

                  const contentType = response.headers.get('content-type')
                  if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Invalid response from server')
                  }

                  const result = await response.json()
                  
                  if (!response.ok) {
                    throw new Error(result.error || 'Delete failed')
                  }
                  
                  toast.success(`Berhasil hapus ${result.deleted} foto`)
                  fetchGallery()
                } catch (error: any) {
                  toast.error(error.message || 'Gagal menghapus foto')
                  fetchGallery()
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          )}
        </div>
        
        {/* Filter to only show items with valid URLs */}
        {(() => {
          const validItems = items.filter(item => 
            item.url && item.url.trim() !== "" && item.url.startsWith("http")
          )
          
          if (items.length === 0) {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No images yet. Upload your first image above.</p>
              </div>
            )
          }
          
          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={validItems.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {validItems.map((item) => (
                    <SortableImage
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
        })()}
      </div>
    </div>
  )
}
