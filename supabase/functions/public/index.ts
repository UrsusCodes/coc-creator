import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/public/, '')

  try {
    // GET /character/:token - get character by share token
    const getMatch = path.match(/^\/character\/([^/]+)$/)
    if (getMatch && req.method === 'GET') {
      const tokenStr = getMatch[1]

      const { data: tokenRow, error: tokenErr } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('token', tokenStr)
        .single()
      if (tokenErr || !tokenRow) {
        return new Response(JSON.stringify({ error: 'Token not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: character, error: charErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', tokenRow.character_id)
        .single()
      if (charErr) throw charErr

      return jsonResponse({
        character,
        tokenType: tokenRow.type,
        tokenId: tokenRow.id,
      })
    }

    // PUT /character/:token - update character via edit token
    const putMatch = path.match(/^\/character\/([^/]+)$/)
    if (putMatch && req.method === 'PUT') {
      const tokenStr = putMatch[1]

      const { data: tokenRow, error: tokenErr } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('token', tokenStr)
        .single()
      if (tokenErr || !tokenRow) {
        return new Response(JSON.stringify({ error: 'Token not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (tokenRow.type !== 'edit') {
        return new Response(JSON.stringify({ error: 'Read-only token' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const body = await req.json()
      const { _change_comment, ...updateData } = body
      const charId = tokenRow.character_id

      // Fetch current state for snapshot
      const { data: current, error: fetchErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .single()
      if (fetchErr) throw fetchErr

      // Save snapshot to history
      await supabase.from('character_history').insert({
        character_id: charId,
        snapshot: current,
        changed_by: `link:${tokenRow.id}`,
        change_comment: _change_comment ?? '',
      })

      // Apply update
      const { data, error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // GET /character/:token/history - history via share token
    const historyMatch = path.match(/^\/character\/([^/]+)\/history$/)
    if (historyMatch && req.method === 'GET') {
      const tokenStr = historyMatch[1]

      const { data: tokenRow, error: tokenErr } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('token', tokenStr)
        .single()
      if (tokenErr || !tokenRow) {
        return new Response(JSON.stringify({ error: 'Token not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabase
        .from('character_history')
        .select('*')
        .eq('character_id', tokenRow.character_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
