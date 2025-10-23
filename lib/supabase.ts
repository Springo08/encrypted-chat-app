// Supabase configuration for encrypted chat app
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oqhxwjauhjbepaoisfus.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHh3amF1aGpiZXBhb2lzZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTE5MDMsImV4cCI6MjA3Njc4NzkwM30.Ozod49EedtRS5G6RJCGpHEToFdv-_DojH-Be723M4zg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseUser {
  id: string
  username: string
  password_hash: string
  encryption_salt: string
  public_key?: string
  created_at: string
  updated_at: string
}

export interface DatabaseRoom {
  id: string
  name: string
  creator_id: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseRoomMember {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  is_active: boolean
}

export interface DatabaseMessage {
  id: string
  room_id: string
  sender_id: string
  ciphertext: string
  iv: string
  message_type: string
  is_edited: boolean
  edited_at?: string
  reply_to_id?: string
  created_at: string
}

// Supabase store implementation
export class SupabaseStore {
  // User methods
  async registerUser(username: string, passwordHash: string, encryptionSalt: string): Promise<string> {
    const { data, error } = await supabase.rpc('register_user', {
      user_username: username,
      user_password_hash: passwordHash,
      user_encryption_salt: encryptionSalt
    })

    if (error) throw error
    return data
  }

  async getUserByUsername(username: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  }

  // Room methods
  async createRoom(name: string, creatorId: string, memberUsernames: string[] = []): Promise<string> {
    const { data, error } = await supabase.rpc('create_room', {
      room_name: name,
      creator_uuid: creatorId,
      member_usernames: memberUsernames
    })

    if (error) throw error
    return data
  }

  async getUserRooms(userId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_user_rooms', {
      user_uuid: userId
    })

    if (error) throw error
    return data || []
  }

  async getRoomMembers(roomId: string, userId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_room_members', {
      room_uuid: roomId,
      requesting_user_uuid: userId
    })

    if (error) throw error
    return data || []
  }

  // Message methods
  async sendMessage(
    roomId: string,
    senderId: string,
    ciphertext: string,
    iv: string,
    messageType: string = 'text',
    replyToId?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('send_message', {
      room_uuid: roomId,
      sender_uuid: senderId,
      message_ciphertext: ciphertext,
      message_iv: iv,
      message_type: messageType,
      reply_to_message_id: replyToId
    })

    if (error) throw error
    return data
  }

  async getRoomMessages(roomId: string, userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_room_messages', {
      room_uuid: roomId,
      user_uuid: userId,
      limit_count: limit,
      offset_count: offset
    })

    if (error) throw error
    return data || []
  }

  // Additional methods
  async markRoomAsRead(userId: string, roomId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_room_as_read', {
      user_uuid: userId,
      room_uuid: roomId
    })

    if (error) throw error
  }

  async getUnreadMessageCount(userId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_unread_message_count', {
      user_uuid: userId
    })

    if (error) throw error
    return data || []
  }

  // Real-time subscriptions
  subscribeToRoomMessages(roomId: string, callback: (message: any) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToUserRooms(userId: string, callback: (room: any) => void) {
    return supabase
      .channel(`user_rooms:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

export const supabaseStore = new SupabaseStore()
