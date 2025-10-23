import { type NextRequest, NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"
import { deriveKey, generateSalt, saltToBase64 } from "@/lib/crypto"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    // Generate salt for encryption
    const salt = generateSalt()
    const saltBase64 = saltToBase64(salt)

    // Hash password (you should use bcrypt or similar in production)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    // Register user in Supabase
    const userId = await supabaseStore.registerUser(username, passwordHash, saltBase64)

    return NextResponse.json({ 
      success: true,
      userId,
      message: "User registered successfully"
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    
    if (error.message?.includes("Username already exists")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
