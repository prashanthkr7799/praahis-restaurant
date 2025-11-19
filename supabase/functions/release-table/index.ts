// Supabase Edge Function to release table when customer leaves
// Deploy: supabase functions deploy release-table

/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { tableId, sessionId } = await req.json()

    // Validate inputs
    if (!tableId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: tableId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Releasing table: ${tableId}, session: ${sessionId || 'none'}`)

    // 1. End the session if sessionId provided
    if (sessionId) {
      const { error: sessionError } = await supabase
        .from('table_sessions')
        .update({
          status: 'cancelled',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('status', 'active') // Only update if still active

      if (sessionError) {
        console.error('Error ending session:', sessionError)
        // Don't fail the request - continue to free the table
      } else {
        console.log(`Session ${sessionId} ended`)
      }
    }

    // 2. Mark table as free
    const { error: tableError } = await supabase
      .from('tables')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)

    if (tableError) {
      console.error('Error freeing table:', tableError)
      return new Response(
        JSON.stringify({ error: 'Failed to free table', details: tableError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Table ${tableId} freed successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Table released successfully',
        tableId,
        sessionId: sessionId || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in release-table function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
