// Supabase configuration for encrypted chat app
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqhxwjauhjbepaoisfus.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHh3amF1aGpiZXBhb2lzZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTE5MDMsImV4cCI6MjA3Njc4NzkwM30.Ozod49EedtRS5G6RJCGpHEToFdv-_DojH-Be723M4zg'

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
  // Check if database is properly set up
  async checkDatabaseSetup(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      return !error
    } catch {
      return false
    }
  }
  // User methods
  async registerUser(username: string, passwordHash: string, encryptionSalt: string): Promise<string> {
    try {
      // First check if database is set up
      const isDatabaseReady = await this.checkDatabaseSetup()
      if (!isDatabaseReady) {
        throw new Error('Database not properly configured. Please set up the database tables first.')
      }

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError)
        throw new Error(`Database error: ${checkError.message}`)
      }

      if (existingUser) {
        throw new Error('Username already exists')
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          password_hash: passwordHash,
          encryption_salt: encryptionSalt
        })
        .select('id')
        .single()

      if (error) {
        console.error('Registration error:', error)
        if (error.code === '42P01') {
          throw new Error('Database table "users" does not exist. Please set up the database first.')
        }
        throw new Error(`Registration failed: ${error.message}`)
      }
      return data.id
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(`Registration failed: ${error.message}`)
    }
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
    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        creator_id: creatorId,
        is_encrypted: true
      })
      .select('id')
      .single()

    if (roomError) throw roomError

    // Add creator as member
    const { error: creatorError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: creatorId
      })

    if (creatorError) throw creatorError

    // Add other members if specified
    if (memberUsernames.length > 0) {
      const { data: memberUsers } = await supabase
        .from('users')
        .select('id')
        .in('username', memberUsernames)

      if (memberUsers && memberUsers.length > 0) {
        const memberIds = memberUsers.map(user => ({
          room_id: room.id,
          user_id: user.id
        }))

        const { error: membersError } = await supabase
          .from('room_members')
          .insert(memberIds)

        if (membersError) throw membersError
      }
    }

    return room.id
  }

  async getUserRooms(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        room_id,
        rooms!inner(
          id,
          name,
          creator_id,
          is_encrypted,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  async getRoomMembers(roomId: string, userId: string): Promise<any[]> {
    // First check if user is a member of the room
    const { data: membership } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!membership) {
      throw new Error('User is not a member of this room')
    }

    const { data, error } = await supabase
      .from('room_members')
      .select(`
        user_id,
        joined_at,
        is_active,
        users!inner(
          id,
          username
        )
      `)
      .eq('room_id', roomId)

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
    // Check if sender is a member of the room
    const { data: membership } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', senderId)
      .eq('is_active', true)
      .single()

    if (!membership) {
      throw new Error('User is not a member of this room')
    }

    // Check if reply message exists (if specified)
    if (replyToId) {
      const { data: replyMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('id', replyToId)
        .eq('room_id', roomId)
        .single()

      if (!replyMessage) {
        throw new Error('Reply message does not exist in this room')
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        ciphertext,
        iv,
        message_type: messageType,
        reply_to_id: replyToId
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async getRoomMessages(roomId: string, userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    // Check if user is a member of the room
    const { data: membership } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!membership) {
      throw new Error('User is not a member of this room')
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        ciphertext,
        iv,
        message_type,
        is_edited,
        edited_at,
        reply_to_id,
        created_at,
        users!inner(
          username
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  // Additional methods
  async markRoomAsRead(userId: string, roomId: string): Promise<void> {
    const { error } = await supabase
      .from('user_room_reads')
      .upsert({
        user_id: userId,
        room_id: roomId,
        last_read_at: new Date().toISOString()
      })

    if (error) throw error
  }

  async getUnreadMessageCount(userId: string): Promise<any[]> {
    // This is a simplified version - for full implementation, you'd need to join with user_room_reads
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        room_id,
        rooms!inner(
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

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
