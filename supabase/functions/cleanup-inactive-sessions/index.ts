import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  session_id: string
  table_id: string
  table_number: string
  inactive_duration: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🧹 Starting inactive session cleanup...')

    // Call the cleanup function (5-minute timeout by default)
    const { data: cleanedSessions, error } = await supabase
      .rpc('cleanup_inactive_sessions', { p_timeout_minutes: 5 })

    if (error) {
      console.error('❌ Error during cleanup:', error)
      throw error
    }

    const results = cleanedSessions as CleanupResult[] || []
    const count = results.length

    console.log(`✅ Cleaned up ${count} inactive session(s)`)

    // Log each cleaned session
    if (count > 0) {
      results.forEach((session) => {
        console.log(`  📋 Session ${session.session_id}`)
        console.log(`     Table: ${session.table_number} (${session.table_id})`)
        console.log(`     Inactive for: ${session.inactive_duration}`)
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${count} inactive session(s)`,
        sessions: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Cleanup function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
