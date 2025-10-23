"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Lock, Users, Plus } from "lucide-react"
import { encryptMessage, decryptMessage } from "@/lib/crypto"
import type { Message, Room } from "@/lib/store"
import { NewRoomDialog } from "./new-room-dialog"

interface ChatInterfaceProps {
  username: string
  encryptionKey: CryptoKey
  onLogout: () => void
}

export function ChatInterface({ username, encryptionKey, onLogout }: ChatInterfaceProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map())
  const [newMessage, setNewMessage] = useState("")
  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch rooms
  useEffect(() => {
    fetchRooms()
  }, [])

  // Fetch messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id)
      const interval = setInterval(() => fetchMessages(selectedRoom.id), 2000)
      return () => clearInterval(interval)
    }
  }, [selectedRoom])

  // Decrypt messages
  useEffect(() => {
    const decryptAll = async () => {
      const newDecrypted = new Map<string, string>()
      for (const msg of messages) {
        try {
          const decrypted = await decryptMessage({ ciphertext: msg.ciphertext, iv: msg.iv }, encryptionKey)
          newDecrypted.set(msg.id, decrypted)
        } catch (error) {
          newDecrypted.set(msg.id, "[Unable to decrypt]")
        }
      }
      setDecryptedMessages(newDecrypted)
    }
    decryptAll()
  }, [messages, encryptionKey])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [decryptedMessages])

  const fetchRooms = async () => {
    const response = await fetch("/api/rooms", {
      headers: { "x-username": username },
    })
    const data = await response.json()
    setRooms(data.rooms || [])
    if (data.rooms?.length > 0 && !selectedRoom) {
      setSelectedRoom(data.rooms[0])
    }
  }

  const fetchMessages = async (roomId: string) => {
    const response = await fetch(`/api/messages?roomId=${roomId}`, {
      headers: { "x-username": username },
    })
    const data = await response.json()
    setMessages(data.messages || [])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom) return

    const encrypted = await encryptMessage(newMessage, encryptionKey)

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username,
      },
      body: JSON.stringify({
        roomId: selectedRoom.id,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
      }),
    })

    setNewMessage("")
    fetchMessages(selectedRoom.id)
  }

  const handleCreateRoom = async (name: string, participants: string[]) => {
    await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username,
      },
      body: JSON.stringify({ name, participants }),
    })
    fetchRooms()
    setIsNewRoomOpen(false)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-semibold text-lg">SecureChat</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{username}</span>
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <Button onClick={() => setIsNewRoomOpen(true)} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Room
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRoom?.id === room.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{room.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{room.participants.join(", ")}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{selectedRoom.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedRoom.participants.join(", ")}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg) => {
                  const isOwn = msg.sender === username
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {msg.sender[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : ""}`}>
                        <div className="text-xs text-muted-foreground">{msg.sender}</div>
                        <Card
                          className={`px-4 py-2 max-w-md ${isOwn ? "bg-primary text-primary-foreground" : "bg-card"}`}
                        >
                          <p className="text-sm leading-relaxed">{decryptedMessages.get(msg.id) || "Decrypting..."}</p>
                        </Card>
                        <div className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-input"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <NewRoomDialog open={isNewRoomOpen} onOpenChange={setIsNewRoomOpen} onCreateRoom={handleCreateRoom} />
    </div>
  )
}
