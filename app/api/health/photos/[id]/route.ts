import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { deleteFromR2 } from "@/lib/r2"
import type { ProgressPhoto } from "@/types"

const USER_ID = "default_user"

// ============================================
// GET - Fetch a single progress photo
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photoId = parseInt(id)

    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: "Invalid photo ID" },
        { status: 400 }
      )
    }

    const [photo] = await sql<ProgressPhoto[]>`
      SELECT * FROM progress_photos
      WHERE id = ${photoId} AND user_id = ${USER_ID}
    `

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("Error fetching progress photo:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress photo" },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete a progress photo
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photoId = parseInt(id)

    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: "Invalid photo ID" },
        { status: 400 }
      )
    }

    // Get the photo first to get the URL
    const [photo] = await sql<ProgressPhoto[]>`
      SELECT * FROM progress_photos
      WHERE id = ${photoId} AND user_id = ${USER_ID}
    `

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      )
    }

    // Delete from R2
    try {
      await deleteFromR2(photo.photo_url)
    } catch (r2Error) {
      console.error("Error deleting from R2:", r2Error)
      // Continue with database deletion even if R2 delete fails
    }

    // Delete from database
    await sql`
      DELETE FROM progress_photos
      WHERE id = ${photoId} AND user_id = ${USER_ID}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting progress photo:", error)
    return NextResponse.json(
      { error: "Failed to delete progress photo" },
      { status: 500 }
    )
  }
}
