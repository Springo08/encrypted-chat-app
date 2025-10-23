"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, CheckCircle, AlertCircle } from "lucide-react"

export default function SetupPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [setupStatus, setSetupStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const checkDatabase = async () => {
    setIsChecking(true)
    setSetupStatus('checking')
    setErrorMessage('')

    try {
      const response = await fetch('/api/setup/check')
      const data = await response.json()

      if (data.success) {
        setSetupStatus('success')
      } else {
        setSetupStatus('error')
        setErrorMessage(data.error || 'Database check failed')
      }
    } catch (error: any) {
      setSetupStatus('error')
      setErrorMessage(error.message)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold text-balance">Database Setup</CardTitle>
          <CardDescription className="text-muted-foreground text-pretty">
            Check if your database is properly configured for the encrypted chat app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupStatus === 'idle' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to check if your Supabase database is properly set up.
              </p>
              <Button onClick={checkDatabase} className="w-full">
                Check Database
              </Button>
            </div>
          )}

          {setupStatus === 'checking' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Checking database...</p>
            </div>
          )}

          {setupStatus === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Database Ready!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your database is properly configured. You can now use the chat app.
              </p>
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Go to Chat App
              </Button>
            </div>
          )}

          {setupStatus === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Database Setup Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-left">
                <h4 className="font-semibold text-yellow-800 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Go to your Supabase dashboard</li>
                  <li>2. Navigate to the SQL Editor</li>
                  <li>3. Run the SQL scripts from the /scripts folder</li>
                  <li>4. Start with 01-create-tables-optimized.sql</li>
                  <li>5. Then run 02-enable-rls-optimized.sql</li>
                  <li>6. Finally run 03-create-functions-optimized.sql</li>
                </ol>
              </div>
              <Button onClick={checkDatabase} className="w-full mt-4">
                Check Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
