import { type NextRequest, NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const username = request.headers.get("x-username")

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user ID from username
    const user = await supabaseStore.getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const rooms = await supabaseStore.getUserRooms(user.id)
    
    // Transform data to match frontend expectations
    const transformedRooms = rooms.map(room => ({
      id: room.room_id,
      name: room.room_name,
      participants: [], // Will be populated when needed
      isEncrypted: room.is_encrypted,
      createdAt: room.created_at,
      latestMessage: room.latest_message_ciphertext ? {
        ciphertext: room.latest_message_ciphertext,
        iv: room.latest_message_iv,
        timestamp: new Date(room.latest_message_time).getTime()
      } : null,
      unreadCount: room.unread_count
    }))

    return NextResponse.json({ rooms: transformedRooms })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const username = request.headers.get("x-username")

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, participants } = await request.json()

    if (!name || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Get user ID from username
    const user = await supabaseStore.getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([username, ...participants])]
    
    const roomId = await supabaseStore.createRoom(name, user.id, allParticipants)
    
    return NextResponse.json({ 
      room: {
        id: roomId,
        name,
        participants: allParticipants,
        isEncrypted: true
      }
    })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
