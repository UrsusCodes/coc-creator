import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

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

    // ══════════════════════════════════════════════════════════════
    // PLAYER MANAGEMENT
    // ══════════════════════════════════════════════════════════════

    // GET /players - list all players
    if (path === '/players' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, login, is_active, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      // Enrich with assigned code count and character count
      const enriched = await Promise.all(
        (data ?? []).map(async (p: Record<string, unknown>) => {
          const { count: codeCount } = await supabase
            .from('player_codes')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', p.id)
          const { count: charCount } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', p.id)
          return { ...p, code_count: codeCount ?? 0, character_count: charCount ?? 0 }
        })
      )
      return jsonResponse(enriched)
    }

    // POST /players - create a player
    if (path === '/players' && req.method === 'POST') {
      const body = await req.json()
      const { name, login, password } = body
      if (!name || !login || !password) {
        return new Response(JSON.stringify({ error: 'name, login, password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const password_hash = await bcrypt.hash(password)
      const { data, error } = await supabase
        .from('players')
        .insert({ name, login, password_hash })
        .select('id, name, login, is_active, created_at')
        .single()
      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: 'Login already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        throw error
      }
      return jsonResponse(data)
    }

    // PUT /players/:id - update player
    const playerUpdateMatch = path.match(/^\/players\/([^/]+)$/)
    if (playerUpdateMatch && req.method === 'PUT') {
      const body = await req.json()
      const updateData: Record<string, unknown> = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.login !== undefined) updateData.login = body.login
      if (body.is_active !== undefined) updateData.is_active = body.is_active
      if (body.password) {
        updateData.password_hash = await bcrypt.hash(body.password)
      }

      const { data, error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerUpdateMatch[1])
        .select('id, name, login, is_active, created_at')
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // DELETE /players/:id
    const playerDeleteMatch = path.match(/^\/players\/([^/]+)$/)
    if (playerDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerDeleteMatch[1])
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // ── Code assignment ──────────────────────────────────────────

    // GET /players/:id/codes - list codes assigned to player
    const playerCodesGetMatch = path.match(/^\/players\/([^/]+)\/codes$/)
    if (playerCodesGetMatch && req.method === 'GET') {
      const { data, error } = await supabase
        .from('player_codes')
        .select('id, invite_code_id, assigned_at, invite_codes(*)')
        .eq('player_id', playerCodesGetMatch[1])
        .order('assigned_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // POST /players/:id/codes - assign code to player
    const playerCodesPostMatch = path.match(/^\/players\/([^/]+)\/codes$/)
    if (playerCodesPostMatch && req.method === 'POST') {
      const body = await req.json()
      const { invite_code_id } = body
      if (!invite_code_id) {
        return new Response(JSON.stringify({ error: 'invite_code_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabase
        .from('player_codes')
        .insert({
          player_id: playerCodesPostMatch[1],
          invite_code_id,
        })
        .select('id, invite_code_id, assigned_at')
        .single()
      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: 'Code already assigned' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        throw error
      }
      return jsonResponse(data)
    }

    // DELETE /players/:playerId/codes/:codeId - unassign code
    const playerCodesDeleteMatch = path.match(/^\/players\/([^/]+)\/codes\/([^/]+)$/)
    if (playerCodesDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('player_codes')
        .delete()
        .eq('player_id', playerCodesDeleteMatch[1])
        .eq('invite_code_id', playerCodesDeleteMatch[2])
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // ══════════════════════════════════════════════════════════════
    // PENDING EDITS
    // ══════════════════════════════════════════════════════════════

    // GET /pending-edits - list all pending edits
    if (path === '/pending-edits' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('pending_edits')
        .select('*, characters(name, player_name), players(name, login)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // GET /pending-edits/:id - single pending edit with current character data for diff
    const pendingGetMatch = path.match(/^\/pending-edits\/([^/]+)$/)
    if (pendingGetMatch && req.method === 'GET') {
      const { data: edit, error } = await supabase
        .from('pending_edits')
        .select('*, characters(*), players(name, login)')
        .eq('id', pendingGetMatch[1])
        .single()
      if (error) throw error
      return jsonResponse(edit)
    }

    // POST /pending-edits/:id/approve
    const approveMatch = path.match(/^\/pending-edits\/([^/]+)\/approve$/)
    if (approveMatch && req.method === 'POST') {
      const editId = approveMatch[1]

      // Get the pending edit
      const { data: edit, error: editErr } = await supabase
        .from('pending_edits')
        .select('*')
        .eq('id', editId)
        .eq('status', 'pending')
        .single()
      if (editErr || !edit) {
        return new Response(JSON.stringify({ error: 'Pending edit not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Snapshot current character to history
      const { data: current, error: fetchErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', edit.character_id)
        .single()
      if (fetchErr) throw fetchErr

      await supabase.from('character_history').insert({
        character_id: edit.character_id,
        snapshot: current,
        changed_by: `player:${edit.player_id}`,
        change_comment: `[Zatwierdzono edycję gracza] ${edit.change_comment}`,
      })

      // Apply proposed data
      const { id: _id, created_at: _ca, updated_at: _ua, player_id: _pid, invite_code_id: _ici, invite_code: _ic, status: _st, ...proposedFields } = edit.proposed_data
      const { data: updated, error: updateErr } = await supabase
        .from('characters')
        .update(proposedFields)
        .eq('id', edit.character_id)
        .select()
        .single()
      if (updateErr) throw updateErr

      // Mark edit as approved
      const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
      await supabase
        .from('pending_edits')
        .update({
          status: 'approved',
          admin_comment: body.admin_comment ?? '',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', editId)

      return jsonResponse(updated)
    }

    // POST /pending-edits/:id/reject
    const rejectMatch = path.match(/^\/pending-edits\/([^/]+)\/reject$/)
    if (rejectMatch && req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('pending_edits')
        .update({
          status: 'rejected',
          admin_comment: body.admin_comment ?? '',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', rejectMatch[1])
        .eq('status', 'pending')
        .select()
        .single()
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
