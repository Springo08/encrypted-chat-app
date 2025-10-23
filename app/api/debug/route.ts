import { type NextRequest, NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const users = await supabaseStore.getAllUsers()
    
    // Get all room members
    const roomMembers = await supabaseStore.getAllRoomMembers()
    
    return NextResponse.json({ 
      users,
      roomMembers,
      summary: {
        totalUsers: users.length,
        totalRoomMemberships: roomMembers.length,
        uniqueRooms: [...new Set(roomMembers.map(rm => rm.room_id))].length
      }
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
