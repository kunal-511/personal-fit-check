"use client"

import { useState } from "react"
import { Trash2, Expand, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ProgressPhoto } from "@/types"

interface ProgressPhotoCardProps {
  photo: ProgressPhoto
  onDelete?: (id: number) => Promise<void>
  onView?: (photo: ProgressPhoto) => void
  className?: string
}

const CATEGORY_COLORS = {
  front: "bg-primary/20 text-primary",
  side: "bg-purple-500/20 text-purple-400",
  back: "bg-amber-500/20 text-amber-400",
}

export function ProgressPhotoCard({
  photo,
  onDelete,
  onView,
  className,
}: ProgressPhotoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    await onDelete(photo.id)
    setIsDeleting(false)
    setShowConfirm(false)
  }

  return (
    <div
      className={cn(
        "group relative flex-shrink-0 w-32 sm:w-40 rounded-lg overflow-hidden bg-secondary/30",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-[3/4] relative">
        <img
          src={photo.photo_url}
          alt={`Progress photo - ${photo.category}`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />

        {/* Category Badge */}
        <span
          className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
            CATEGORY_COLORS[photo.category]
          )}
        >
          {photo.category}
        </span>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => onView(photo)}
            >
              <Expand className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:bg-red-500/20"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Delete Confirmation */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 gap-2">
            <p className="text-xs text-center text-white">Delete this photo?</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notes (if any) */}
      {photo.notes && (
        <div className="p-2">
          <p className="text-xs text-muted-foreground truncate">{photo.notes}</p>
        </div>
      )}
    </div>
  )
}
