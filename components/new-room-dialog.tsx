"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NewRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateRoom: (name: string, participants: string[]) => void
}

export function NewRoomDialog({ open, onOpenChange, onCreateRoom }: NewRoomDialogProps) {
  const [roomName, setRoomName] = useState("")
  const [participantsInput, setParticipantsInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return

    const participants = participantsInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    onCreateRoom(roomName, participants)
    setRoomName("")
    setParticipantsInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>Create a new encrypted chat room and invite participants.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Team Chat"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">Participants (comma-separated)</Label>
            <Input
              id="participants"
              value={participantsInput}
              onChange={(e) => setParticipantsInput(e.target.value)}
              placeholder="e.g., alice, bob, charlie"
            />
            <p className="text-xs text-muted-foreground">You will be automatically added to the room.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Room</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
