"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, Loader2, Check } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useHealthStore } from "@/lib/health-store"
import { cn } from "@/lib/utils"
import type { PhotoCategory } from "@/types"

interface ProgressPhotosUploadProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

const CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "side", label: "Side" },
  { value: "back", label: "Back" },
]

export function ProgressPhotosUpload({
  onSuccess,
  onCancel,
  className,
}: ProgressPhotosUploadProps) {
  const { uploadProgressPhoto, progressPhotos } = useHealthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCategory] = useState<PhotoCategory>("front")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type (include HEIC/HEIF for iPhone photos)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

    // Check both MIME type and extension (browsers may not detect HEIC MIME type correctly)
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension)
    if (!isValidType) {
      alert("Please select a JPEG, PNG, WebP, or HEIC image")
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert("File too large. Maximum size is 10MB")
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) return

    const success = await uploadProgressPhoto(
      selectedFile,
      category,
      date,
      notes || undefined
    )

    if (success) {
      clearFile()
      setNotes("")
      onSuccess?.()
    }
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Upload Progress Photo</h2>
            <p className="text-sm text-muted-foreground">Track your visual progress</p>
          </div>
        </div>

        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-white/10 hover:border-white/20",
            preview ? "p-2" : "p-8"
          )}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your photo here, or
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, WebP, or HEIC (max 10MB)
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={category === value ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCategory(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="photo-date">Date</Label>
          <Input
            id="photo-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="photo-notes">Notes (optional)</Label>
          <Input
            id="photo-notes"
            placeholder="e.g., End of week 4, feeling stronger..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Error Display */}
        {progressPhotos.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{progressPhotos.error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={progressPhotos.isUploading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={!selectedFile || progressPhotos.isUploading}
          >
            {progressPhotos.isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Upload Photo
              </>
            )}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
