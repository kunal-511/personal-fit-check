import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const AUTH_COOKIE = "fittrack_auth"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()
    const correctPin = process.env.AUTH_PIN

    if (!correctPin) {
      return NextResponse.json(
        { error: "Auth not configured" },
        { status: 500 }
      )
    }

    if (pin === correctPin) {
      const cookieStore = await cookies()
      cookieStore.set(AUTH_COOKIE, "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Invalid PIN" },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const auth = cookieStore.get(AUTH_COOKIE)
  return NextResponse.json({ authenticated: auth?.value === "authenticated" })
}
