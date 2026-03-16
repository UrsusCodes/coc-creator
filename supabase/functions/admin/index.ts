import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-admin-password, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate admin password
  const adminPassword = Deno.env.get('ADMIN_PASSWORD')
  const providedPassword = req.headers.get('x-admin-password')

  if (!adminPassword || providedPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create service role client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/admin/, '')

  try {
    // /ping - health check
    if (path === '/ping') {
      return jsonResponse({ ok: true })
    }

    // GET /codes - list all invite codes
    if (path === '/codes' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // POST /codes - create a new invite code
    if (path === '/codes' && req.method === 'POST') {
      const body = await req.json()
      const methods = body.methods ?? [body.method]
      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          code: body.code,
          method: methods[0],
          methods,
          era: body.era,
          max_tries: body.max_tries ?? 1,
          perks: body.perks ?? [],
          max_skill_value: body.max_skill_value ?? 99,
        })
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // DELETE /codes/:id
    const codeDeleteMatch = path.match(/^\/codes\/([^/]+)$/)
    if (codeDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeDeleteMatch[1])
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // GET /characters - list all characters
    if (path === '/characters' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // GET /characters/:id/history - version history for a character
    const historyMatch = path.match(/^\/characters\/([^/]+)\/history$/)
    if (historyMatch && req.method === 'GET') {
      const { data, error } = await supabase
        .from('character_history')
        .select('*')
        .eq('character_id', historyMatch[1])
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // GET /characters/:id/share - list share tokens for a character
    const shareListMatch = path.match(/^\/characters\/([^/]+)\/share$/)
    if (shareListMatch && req.method === 'GET') {
      const { data, error } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('character_id', shareListMatch[1])
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // POST /characters/:id/share - create a share token
    const shareCreateMatch = path.match(/^\/characters\/([^/]+)\/share$/)
    if (shareCreateMatch && req.method === 'POST') {
      const body = await req.json()
      const token = crypto.randomUUID()
      const { data, error } = await supabase
        .from('share_tokens')
        .insert({
          character_id: shareCreateMatch[1],
          token,
          type: body.type,
        })
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // DELETE /share/:tokenId - delete a share token
    const shareDeleteMatch = path.match(/^\/share\/([^/]+)$/)
    if (shareDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('share_tokens')
        .delete()
        .eq('id', shareDeleteMatch[1])
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // PUT /characters/:id - update a character (with history snapshot)
    const charUpdateMatch = path.match(/^\/characters\/([^/]+)$/)
    if (charUpdateMatch && req.method === 'PUT') {
      const charId = charUpdateMatch[1]
      const body = await req.json()

      // Extract change comment (not a character field)
      const { _change_comment, ...updateData } = body

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
        changed_by: 'admin',
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

    // DELETE /characters/:id
    const charDeleteMatch = path.match(/^\/characters\/([^/]+)$/)
    if (charDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', charDeleteMatch[1])
      if (error) throw error
      return jsonResponse({ deleted: true })
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
