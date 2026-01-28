"use client"

import { useState, useEffect, useCallback } from "react"
import { Camera, Plus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProgressPhotoCard } from "./ProgressPhotoCard"
import { ProgressPhotosUpload } from "./ProgressPhotosUpload"
import { useHealthStore } from "@/lib/health-store"
import { cn } from "@/lib/utils"
import type { ProgressPhoto } from "@/types"

interface ProgressPhotosGalleryProps {
  className?: string
}

export function ProgressPhotosGallery({ className }: ProgressPhotosGalleryProps) {
  const { progressPhotos, fetchProgressPhotos, deleteProgressPhoto } = useHealthStore()
  const [showUpload, setShowUpload] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    fetchProgressPhotos(365) // Fetch last year of photos
  }, [fetchProgressPhotos])

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteProgressPhoto(id)
      // Close lightbox if the deleted photo is being viewed
      if (lightboxPhoto?.id === id) {
        setLightboxPhoto(null)
      }
    },
    [deleteProgressPhoto, lightboxPhoto]
  )

  const handleUploadSuccess = () => {
    setShowUpload(false)
  }

  const handleViewPhoto = (photo: ProgressPhoto) => {
    setImageLoading(true)
    setLightboxPhoto(photo)
  }

  // Get sorted dates for timeline
  const sortedDates = Object.keys(progressPhotos.groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Navigate lightbox
  const allPhotos = progressPhotos.photos
  const currentIndex = lightboxPhoto
    ? allPhotos.findIndex((p) => p.id === lightboxPhoto.id)
    : -1

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setImageLoading(true)
      setLightboxPhoto(allPhotos[currentIndex - 1])
    }
  }, [currentIndex, allPhotos])

  const goToNext = useCallback(() => {
    if (currentIndex < allPhotos.length - 1) {
      setImageLoading(true)
      setLightboxPhoto(allPhotos[currentIndex + 1])
    }
  }, [currentIndex, allPhotos])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return
      if (e.key === "Escape") setLightboxPhoto(null)
      if (e.key === "ArrowLeft") goToPrev()
      if (e.key === "ArrowRight") goToNext()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxPhoto, goToPrev, goToNext])

  return (
    <>
      <GlassCard className={cn("p-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Progress Photos</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            {showUpload ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Photo
              </>
            )}
          </Button>
        </div>

        {/* Upload Form */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <ProgressPhotosUpload
                onSuccess={handleUploadSuccess}
                onCancel={() => setShowUpload(false)}
                className="border-0 p-0 bg-transparent"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {progressPhotos.isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-32 sm:w-40">
                <Skeleton className="aspect-[3/4] rounded-lg" />
              </div>
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          /* Empty State */
          <div className="flex h-32 items-center justify-center rounded-lg bg-secondary/30">
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No progress photos yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start tracking your visual progress
              </p>
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* Date Marker */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Photos Row */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {progressPhotos.groupedByDate[date].map((photo) => (
                    <ProgressPhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={handleDelete}
                      onView={handleViewPhoto}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxPhoto(null)}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10"
              onClick={() => setLightboxPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {currentIndex < allPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            <div
              className="flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Loading Spinner */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}

              <img
                src={lightboxPhoto.photo_url}
                alt={`Progress photo - ${lightboxPhoto.category}`}
                crossOrigin="anonymous"
                className={cn(
                  "max-w-[90vw] max-h-[75vh] object-contain rounded-lg transition-opacity",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />

              {/* Photo Info */}
              {!imageLoading && (
                <div className="mt-4 text-center text-white">
                  <p className="text-sm font-medium capitalize">
                    {lightboxPhoto.category} View
                  </p>
                  <p className="text-xs text-white/60">
                    {formatDate(lightboxPhoto.date)}
                  </p>
                  {lightboxPhoto.notes && (
                    <p className="text-sm text-white/80 mt-2">{lightboxPhoto.notes}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
