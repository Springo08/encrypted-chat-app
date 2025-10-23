import { type NextRequest, NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const username = request.headers.get("x-username")
  const roomId = request.nextUrl.searchParams.get("roomId")

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!roomId) {
    return NextResponse.json({ error: "Room ID required" }, { status: 400 })
  }

  try {
    // Get user ID from username
    const user = await supabaseStore.getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const messages = await supabaseStore.getRoomMessages(roomId, user.id)
    
    // Transform data to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      id: msg.message_id,
      roomId: roomId,
      sender: msg.sender_username,
      ciphertext: msg.ciphertext,
      iv: msg.iv,
      timestamp: new Date(msg.created_at).getTime(),
      isEdited: msg.is_edited,
      editedAt: msg.edited_at ? new Date(msg.edited_at).getTime() : null,
      replyToId: msg.reply_to_id,
      replyToSenderUsername: msg.reply_to_sender_username
    }))

    return NextResponse.json({ messages: transformedMessages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const username = request.headers.get("x-username")

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { roomId, ciphertext, iv } = await request.json()

    if (!roomId || !ciphertext || !iv) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Get user ID from username
    const user = await supabaseStore.getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const messageId = await supabaseStore.sendMessage(roomId, user.id, ciphertext, iv)

    return NextResponse.json({ 
      message: {
        id: messageId,
        roomId,
        sender: username,
        ciphertext,
        iv,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
