import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcryptjs from 'https://esm.sh/bcryptjs@3.0.2'
const bcryptHash = (pw: string) => bcryptjs.hashSync(pw, 10)

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
          reroll_budget: body.reroll_budget ?? Math.max(0, (body.max_tries ?? 1) - 1),
          label: body.label ?? '',
          assigned_player_id: body.assigned_player_id ?? null,
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

    // PATCH /codes/:id — edit label/reroll_budget/assignee/perks/era/methods/max_skill_value
    const codePatchMatch = path.match(/^\/codes\/([^/]+)$/)
    if (codePatchMatch && req.method === 'PATCH') {
      const body = await req.json()
      const allowed = [
        'label',
        'reroll_budget',
        'assigned_player_id',
        'perks',
        'max_skill_value',
        'era',
        'methods',
        'is_active',
      ]
      const updateData: Record<string, unknown> = {}
      for (const k of allowed) {
        if (k in body) updateData[k] = body[k]
      }
      // Keep legacy `method` in sync when methods[] changes.
      if (Array.isArray(body.methods) && body.methods.length > 0) {
        updateData.method = body.methods[0]
      }

      const { data, error } = await supabase
        .from('invite_codes')
        .update(updateData)
        .eq('id', codePatchMatch[1])
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // POST /codes/cleanup — delete unused codes + codes whose character is submitted
    // body (optional): { dry_run: boolean } → if true, returns preview without deleting
    if (path === '/codes/cleanup' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const dryRun = body.dry_run === true

      // Preview: fetch all codes + their linked character status.
      const { data: codes, error: codesErr } = await supabase
        .from('invite_codes')
        .select('id, code, label, created_at')
      if (codesErr) throw codesErr

      const { data: chars, error: charsErr } = await supabase
        .from('characters')
        .select('invite_code_id, status')
      if (charsErr) throw charsErr

      const byCode: Record<string, { submitted: boolean; draft: boolean }> = {}
      for (const c of chars ?? []) {
        if (!c.invite_code_id) continue
        const entry = byCode[c.invite_code_id] ?? { submitted: false, draft: false }
        if (c.status === 'submitted') entry.submitted = true
        if (c.status === 'draft') entry.draft = true
        byCode[c.invite_code_id] = entry
      }

      const deletable: typeof codes = []
      for (const code of codes ?? []) {
        const entry = byCode[code.id]
        // Only delete codes with NO linked character (truly unused).
        // Codes linked to submitted characters must be preserved — FK CASCADE would
        // destroy the approved character, violating the "zatwierdzone postaci OK" rule.
        if (!entry) deletable.push(code)
      }

      if (dryRun) {
        return jsonResponse({ dry_run: true, to_delete: deletable, count: deletable.length })
      }

      const ids = deletable.map((c) => c.id)
      if (ids.length === 0) {
        return jsonResponse({ deleted: 0, codes: [] })
      }
      const { error: delErr } = await supabase
        .from('invite_codes')
        .delete()
        .in('id', ids)
      if (delErr) throw delErr
      return jsonResponse({ deleted: ids.length, codes: deletable })
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

      const password_hash = bcryptHash(password)
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
        updateData.password_hash = bcryptHash(body.password)
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

    // ══════════════════════════════════════════════════════════════
    // PORTRAIT FEEDBACK
    // ══════════════════════════════════════════════════════════════

    // GET /portrait-feedback — all feedback (with character name)
    if (path === '/portrait-feedback' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('portrait_feedback')
        .select('*, characters(id, name, player_name), players(name, login)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // GET /portrait-feedback/status — summary counts per status
    if (path === '/portrait-feedback/status' && req.method === 'GET') {
      const { data: chars, error: charsErr } = await supabase
        .from('characters')
        .select('id, name, player_name, portrait_url, art_gallery')
        .order('created_at', { ascending: false })
      if (charsErr) throw charsErr

      const { data: feedbacks, error: fbErr } = await supabase
        .from('portrait_feedback')
        .select('character_id, status')
        .eq('status', 'pending_fix')
      if (fbErr) throw fbErr

      const feedbackByChar = new Set((feedbacks ?? []).map((f: Record<string, unknown>) => f.character_id))

      const report = (chars ?? []).map((c: Record<string, unknown>) => {
        const gallery = (c.art_gallery as unknown[]) ?? []
        const hasGallery = gallery.length > 0
        const hasSelected = !!c.portrait_url
        const hasFeedback = feedbackByChar.has(c.id)

        let portraitStatus: string
        if (hasFeedback) portraitStatus = 'feedback'
        else if (hasSelected) portraitStatus = 'chosen'
        else if (hasGallery) portraitStatus = 'has_gallery'
        else portraitStatus = 'no_portraits'

        return {
          id: c.id,
          name: c.name,
          player_name: c.player_name,
          portrait_status: portraitStatus,
          gallery_count: gallery.length,
          portrait_url: c.portrait_url,
        }
      })
      return jsonResponse(report)
    }

    // GET /characters/:id/portrait-feedback — feedback for one character
    const charFeedbackGetMatch = path.match(/^\/characters\/([^/]+)\/portrait-feedback$/)
    if (charFeedbackGetMatch && req.method === 'GET') {
      const { data, error } = await supabase
        .from('portrait_feedback')
        .select('*, players(name, login)')
        .eq('character_id', charFeedbackGetMatch[1])
        .order('created_at', { ascending: false })
      if (error) throw error
      return jsonResponse(data)
    }

    // PUT /portrait-feedback/:id — update feedback status + admin comment
    const feedbackUpdateMatch = path.match(/^\/portrait-feedback\/([^/]+)$/)
    if (feedbackUpdateMatch && req.method === 'PUT') {
      const body = await req.json()
      const updateData: Record<string, unknown> = {}
      if (body.status !== undefined) updateData.status = body.status
      if (body.admin_comment !== undefined) updateData.admin_comment = body.admin_comment
      if (body.status === 'resolved') updateData.resolved_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('portrait_feedback')
        .update(updateData)
        .eq('id', feedbackUpdateMatch[1])
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ══════════════════════════════════════════════════════════════
    // EDIT PERMISSIONS (player-centric model)
    // ══════════════════════════════════════════════════════════════

    // POST /characters/:id/edit-permission — grant edit permission
    const editPermCreateMatch = path.match(/^\/characters\/([^/]+)\/edit-permission$/)
    if (editPermCreateMatch && req.method === 'POST') {
      const charId = editPermCreateMatch[1]
      const body = await req.json()
      const validModes = ['lore', 'standard', 'full']
      const editMode = validModes.includes(body.edit_mode) ? body.edit_mode : 'standard'
      const duration = body.duration ?? '24h'

      const durationMs: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '3d': 3 * 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
      }
      const expiresAt = duration === 'until_disabled'
        ? null
        : new Date(Date.now() + (durationMs[duration] ?? durationMs['24h'])).toISOString()

      // Get character to find player_id
      const { data: char, error: charErr } = await supabase
        .from('characters')
        .select('player_id')
        .eq('id', charId)
        .single()
      if (charErr) throw charErr
      if (!char.player_id) {
        return new Response(JSON.stringify({ error: 'Character has no assigned player' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Delete existing edit_permissions for this character
      await supabase
        .from('edit_permissions')
        .delete()
        .eq('character_id', charId)

      // Insert new permission
      const { data, error } = await supabase
        .from('edit_permissions')
        .insert({
          character_id: charId,
          player_id: char.player_id,
          edit_mode: editMode,
          expires_at: expiresAt,
        })
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // DELETE /characters/:id/edit-permission — revoke edit permission
    const editPermDeleteMatch = path.match(/^\/characters\/([^/]+)\/edit-permission$/)
    if (editPermDeleteMatch && req.method === 'DELETE') {
      const { error } = await supabase
        .from('edit_permissions')
        .delete()
        .eq('character_id', editPermDeleteMatch[1])
      if (error) throw error
      return jsonResponse({ deleted: true })
    }

    // PUT /characters/:id/assign-player — assign character to a player
    const assignPlayerMatch = path.match(/^\/characters\/([^/]+)\/assign-player$/)
    if (assignPlayerMatch && req.method === 'PUT') {
      const charId = assignPlayerMatch[1]
      const body = await req.json()
      const { player_id } = body
      if (!player_id) {
        return new Response(JSON.stringify({ error: 'player_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabase
        .from('characters')
        .update({ player_id })
        .eq('id', charId)
        .select()
        .single()
      if (error) throw error
      return jsonResponse(data)
    }

    // ══════════════════════════════════════════════════════════════
    // ADMIN DRAFTS
    // ══════════════════════════════════════════════════════════════

    // POST /drafts — create a draft character on a player's account
    if (path === '/drafts' && req.method === 'POST') {
      const body = await req.json()
      const { player_id, wizard_data, locked_step, era, method, perks, max_skill_value } = body

      if (!player_id || !wizard_data) {
        return new Response(JSON.stringify({ error: 'player_id and wizard_data required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate invite code in format DRF-XXXX-XXX
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const code = `DRF-${rand(4)}-${rand(3)}`

      // Create invite code
      const { data: inviteCode, error: codeErr } = await supabase
        .from('invite_codes')
        .insert({
          code,
          method: method ?? 'standard',
          methods: [method ?? 'standard'],
          era: era ?? '1920s',
          max_tries: 1,
          perks: perks ?? [],
          max_skill_value: max_skill_value ?? 80,
          is_active: true,
        })
        .select()
        .single()
      if (codeErr) throw codeErr

      // Create character with draft status
      const characterInsert: Record<string, unknown> = {
        ...wizard_data,
        status: 'draft',
        created_by: 'admin_draft',
        draft_locked_step: locked_step ?? null,
        player_id,
        invite_code_id: inviteCode.id,
        era: era ?? null,
        method: method ?? null,
        perks: perks ?? [],
        max_skill_value: max_skill_value ?? 80,
      }

      const { data: character, error: charErr } = await supabase
        .from('characters')
        .insert(characterInsert)
        .select()
        .single()
      if (charErr) throw charErr

      // Create player_codes junction
      const { error: junctionErr } = await supabase
        .from('player_codes')
        .insert({
          player_id,
          invite_code_id: inviteCode.id,
        })
      if (junctionErr) throw junctionErr

      return jsonResponse({ character, invite_code: inviteCode })
    }

    // POST /characters/:id/grant-reroll — admin increment rerolls_remaining
    const grantRerollMatch = path.match(/^\/characters\/([^/]+)\/grant-reroll$/)
    if (grantRerollMatch && req.method === 'POST') {
      const charId = grantRerollMatch[1]
      const body = await req.json().catch(() => ({}))
      const amount = typeof body.count === 'number' ? body.count : 1
      if (amount <= 0) {
        return new Response(JSON.stringify({ error: 'count must be positive' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: newRemaining, error: rpcErr } = await supabase
        .rpc('grant_reroll', { character_id: charId, amount })
      if (rpcErr) throw rpcErr

      const { data, error } = await supabase
        .from('characters')
        .select('id, rerolls_remaining')
        .eq('id', charId)
        .single()
      if (error) throw error
      return jsonResponse({ ...data, new_remaining: newRemaining })
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
