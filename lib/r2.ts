import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// ============================================
// Cloudflare R2 Storage Client
// ============================================

// Initialize S3-compatible client for Cloudflare R2
const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "fitness-tracker"
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || ""

/**
 * Upload a file to R2 storage
 * @param file - File buffer to upload
 * @param filename - Unique filename for the object
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `progress-photos/${filename}`

  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  // Return the public URL
  return `${PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2 storage
 * @param photoUrl - Full public URL of the photo to delete
 */
export async function deleteFromR2(photoUrl: string): Promise<void> {
  // Extract the key from the URL
  const key = photoUrl.replace(`${PUBLIC_URL}/`, "")

  await R2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}

/**
 * Generate a unique filename for a photo
 * @param originalName - Original filename
 * @param category - Photo category (front/side/back)
 * @returns Unique filename with timestamp
 */
export function generatePhotoFilename(
  originalName: string,
  category: string
): string {
  const timestamp = Date.now()
  const ext = originalName.split(".").pop() || "jpg"
  return `${category}_${timestamp}.${ext}`
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.CLOUDFLARE_R2_ENDPOINT &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_PUBLIC_URL
  )
}
