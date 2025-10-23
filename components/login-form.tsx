"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockKeyhole } from "lucide-react"

interface LoginFormProps {
  onLogin: (username: string, encryptionKey: CryptoKey) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsLoading(true)
    setError("")

    try {
      if (isRegisterMode) {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Registration failed")
        }

        // After registration, proceed with login
      }

      // Login existing user
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      const { user } = await response.json()

      // Import crypto functions
      const { deriveKey, base64ToSalt } = await import("@/lib/crypto")
      
      // Derive encryption key from password and stored salt
      const salt = base64ToSalt(user.encryptionSalt)
      const encryptionKey = await deriveKey(password, salt)

      onLogin(user.username, encryptionKey)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LockKeyhole className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold text-balance">Welcome to SecureChat</CardTitle>
          <CardDescription className="text-muted-foreground text-pretty">
            End-to-end encrypted messaging. Your conversations stay private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-input"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Encryption Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {isRegisterMode 
                  ? "This password will encrypt your messages. Keep it safe!" 
                  : "This password encrypts your messages. Keep it safe."
                }
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isRegisterMode ? "Register & Continue" : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {isRegisterMode ? "Already have an account? Login" : "Need an account? Register"}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a href="/impressum" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Impressum
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
