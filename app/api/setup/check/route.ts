import { NextResponse } from "next/server"
import { supabaseStore } from "@/lib/supabase"

export async function GET() {
  try {
    const isDatabaseReady = await supabaseStore.checkDatabaseSetup()
    
    if (isDatabaseReady) {
      return NextResponse.json({ 
        success: true, 
        message: "Database is properly configured" 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Database tables are not set up. Please run the SQL scripts in the /scripts folder." 
      })
    }
  } catch (error: any) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Database check failed: ${error.message}` 
    })
  }
}
