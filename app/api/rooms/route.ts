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

    console.log('Fetching rooms for user:', username, 'with ID:', user.id)
    const rooms = await supabaseStore.getUserRooms(user.id)
    console.log('Raw rooms data:', rooms)
    
    // Transform data to match frontend expectations
    const transformedRooms = await Promise.all(rooms.map(async (room) => {
      // Get room members for each room
      const members = await supabaseStore.getRoomMembers(room.rooms.id, user.id)
      const participantUsernames = members.map(member => member.users.username)
      
      console.log(`Room ${room.rooms.name} has members:`, participantUsernames)
      
      return {
        id: room.rooms.id,
        name: room.rooms.name,
        participants: participantUsernames,
        isEncrypted: room.rooms.is_encrypted,
        createdAt: room.rooms.created_at,
        latestMessage: null, // Will be populated when needed
        unreadCount: 0 // Will be populated when needed
      }
    }))

    console.log('Transformed rooms:', transformedRooms)

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
