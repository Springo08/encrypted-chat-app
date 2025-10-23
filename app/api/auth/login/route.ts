import { type NextRequest, NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    // Get user from database
    const user = await supabaseStore.getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Hash provided password
    const providedPasswordHash = crypto.createHash('sha256').update(password).digest('hex')

    // Compare password hashes
    if (user.password_hash !== providedPasswordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        encryptionSalt: user.encryption_salt
      },
      message: "Login successful"
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
