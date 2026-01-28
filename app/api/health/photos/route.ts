import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"
import { uploadToR2, generatePhotoFilename, isR2Configured } from "@/lib/r2"
import type { ProgressPhoto, PhotoCategory } from "@/types"

const USER_ID = "default_user"

// ============================================
// GET - Fetch progress photos
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "90")
    const category = searchParams.get("category") as PhotoCategory | null

    // Calculate cutoff date in JavaScript (postgres.js can't interpolate in INTERVAL)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffDateStr = formatDate(cutoffDate)

    let photos: ProgressPhoto[]

    if (category) {
      photos = await sql<ProgressPhoto[]>`
        SELECT * FROM progress_photos
        WHERE user_id = ${USER_ID}
          AND category = ${category}
          AND date >= ${cutoffDateStr}
        ORDER BY date DESC, uploaded_at DESC
      `
    } else {
      photos = await sql<ProgressPhoto[]>`
        SELECT * FROM progress_photos
        WHERE user_id = ${USER_ID}
          AND date >= ${cutoffDateStr}
        ORDER BY date DESC, uploaded_at DESC
      `
    }

    // Group photos by date for timeline view
    const groupedByDate = photos.reduce((acc, photo) => {
      const dateKey = photo.date
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(photo)
      return acc
    }, {} as Record<string, ProgressPhoto[]>)

    return NextResponse.json({
      photos,
      groupedByDate,
      total: photos.length,
    })
  } catch (error) {
    console.error("Error fetching progress photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress photos" },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Upload a new progress photo
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured. Please add R2 credentials to .env.local" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const category = formData.get("category") as PhotoCategory
    const date = formData.get("date") as string | null
    const notes = formData.get("notes") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!category || !["front", "side", "back"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'front', 'side', or 'back'" },
        { status: 400 }
      )
    }

    // Validate file type (include HEIC/HEIF for iPhone photos)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

    // Check both MIME type and extension (browsers may not detect HEIC MIME type correctly)
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension)
    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Must be JPEG, PNG, WebP, or HEIC" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine the correct content type (browsers may not detect HEIC correctly)
    let contentType = file.type
    if (!contentType || contentType === "application/octet-stream") {
      const ext = fileExtension.toLowerCase()
      if (ext === ".heic") contentType = "image/heic"
      else if (ext === ".heif") contentType = "image/heif"
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
      else if (ext === ".png") contentType = "image/png"
      else if (ext === ".webp") contentType = "image/webp"
    }

    // Generate unique filename and upload to R2
    const filename = generatePhotoFilename(file.name, category)
    const photoUrl = await uploadToR2(buffer, filename, contentType)

    // Save metadata to database
    const photoDate = date ? formatDate(new Date(date)) : formatDate(new Date())

    const [photo] = await sql<ProgressPhoto[]>`
      INSERT INTO progress_photos (user_id, date, photo_url, category, notes)
      VALUES (${USER_ID}, ${photoDate}, ${photoUrl}, ${category}, ${notes})
      RETURNING *
    `

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("Error uploading progress photo:", error)
    return NextResponse.json(
      { error: "Failed to upload progress photo" },
      { status: 500 }
    )
  }
}
