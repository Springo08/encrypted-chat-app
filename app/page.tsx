"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)

  const handleLogin = (user: string, key: CryptoKey) => {
    setUsername(user)
    setEncryptionKey(key)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername("")
    setEncryptionKey(null)
  }

  if (!isAuthenticated || !encryptionKey) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <ChatInterface username={username} encryptionKey={encryptionKey} onLogout={handleLogout} />
}
