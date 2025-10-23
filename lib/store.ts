// Simple in-memory message store (in production, use a real database)

export interface Message {
  id: string
  roomId: string
  sender: string
  ciphertext: string
  iv: string
  timestamp: number
}

export interface Room {
  id: string
  name: string
  participants: string[]
}

class MessageStore {
  private messages: Message[] = []
  private rooms: Room[] = []

  // Room methods
  createRoom(name: string, participants: string[]): Room {
    const room: Room = {
      id: crypto.randomUUID(),
      name,
      participants,
    }
    this.rooms.push(room)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.find((r) => r.id === roomId)
  }

  getRoomsForUser(username: string): Room[] {
    return this.rooms.filter((r) => r.participants.includes(username))
  }

  // Message methods
  addMessage(message: Omit<Message, "id" | "timestamp">): Message {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    this.messages.push(newMessage)
    return newMessage
  }

  getMessages(roomId: string): Message[] {
    return this.messages.filter((m) => m.roomId === roomId).sort((a, b) => a.timestamp - b.timestamp)
  }

  getAllMessages(): Message[] {
    return this.messages
  }
}

export const messageStore = new MessageStore()
