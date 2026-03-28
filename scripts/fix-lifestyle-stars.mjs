/**
 * Fixes [Lifestyle] entries in all characters' equipment arrays:
 * 1. Reformats star string: old ★½☆☆☆ → new ★☆··· (☆=half, ·=empty)
 * 2. Fixes lifestyle label: old ratingLabel (e.g. 'Skromny') → correct lifestyle level name (e.g. 'Przeciętny')
 *
 * Usage: ADMIN_PASSWORD=xxx node scripts/fix-lifestyle-stars.mjs
 */

import { readFileSync } from 'fs'

// ── Config ──────────────────────────────────────────────────────────────────

const env = readFileSync('.env.local', 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=')
    if (k) acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.error('Brak ADMIN_PASSWORD. Uruchom: ADMIN_PASSWORD=xxx node scripts/fix-lifestyle-stars.mjs')
  process.exit(1)
}

const ADMIN_URL = `${SUPABASE_URL}/functions/v1/admin`
const HEADERS = {
  'Authorization': `Bearer ${ANON_KEY}`,
  'X-Admin-Password': ADMIN_PASSWORD,
  'Content-Type': 'application/json',
}

// ── Star helpers ─────────────────────────────────────────────────────────────

/** Parse rating from old format: ★=1, ½=0.5, ☆=0 (empty) */
function parseOldStars(starStr) {
  let rating = 0
  for (const ch of starStr) {
    if (ch === '★') rating += 1
    else if (ch === '½') rating += 0.5
    // ☆ = 0 in old format
  }
  return rating
}

/** New star format: ★=full, ☆=half, ·=empty */
function newStarString(rating) {
  const full = Math.floor(rating)
  const half = (rating % 1) >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '☆' : '') + '·'.repeat(empty)
}

// ── Lifestyle label inference ────────────────────────────────────────────────

/** Parse spending level string → number (e.g. '$25' or '25$' → 25) */
function parseSpending(spendingStr) {
  if (!spendingStr) return 0
  return parseFloat(String(spendingStr).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
}

/**
 * Infer correct lifestyle label from spending level + star rating.
 * Based on generatePresets() logic in wealthV2.ts:
 *   Tier A/B (≤$2):   destitute/frugal always
 *   Tier C ($7):       Oszczędny/Wygodny=average(Przeciętny), Ekstra=comfortable(Komfortowy)
 *   Tier D ($25):      Oszczędny=average(Przeciętny), Wygodny/Ekstra=comfortable(Komfortowy)
 *   Tier E ($80):      comfortable(Komfortowy) or elegant(Elegancki) for high stars
 *   Tier F ($300):     elegant(Elegancki) or luxury(Luksusowy)
 */
function inferLifestyleLabel(spendingStr, rating) {
  const spending = parseSpending(spendingStr)

  if (spending <= 0.5) return 'Nędzny'   // Tier A
  if (spending <= 2)   return 'Skromny'  // Tier B

  if (spending <= 7) {
    // Tier C
    return rating >= 2.5 ? 'Komfortowy' : 'Przeciętny'
  }

  if (spending <= 25) {
    // Tier D
    return rating >= 2.5 ? 'Komfortowy' : 'Przeciętny'
  }

  if (spending <= 80) {
    // Tier E
    return rating >= 4.0 ? 'Elegancki' : rating >= 2.0 ? 'Komfortowy' : 'Przeciętny'
  }

  // Tier F
  return rating >= 4.5 ? 'Luksusowy' : rating >= 3.5 ? 'Elegancki' : 'Komfortowy'
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch all characters
  const res = await fetch(`${ADMIN_URL}/characters`, { headers: HEADERS })
  if (!res.ok) { console.error('Błąd pobierania postaci:', await res.text()); process.exit(1) }
  const characters = await res.json()
  console.log(`Pobrano ${characters.length} postaci\n`)

  let fixed = 0

  for (const char of characters) {
    const equipment = char.equipment ?? []
    const lifestyleIdx = equipment.findIndex(e => e.startsWith('[Lifestyle]'))

    if (lifestyleIdx === -1) {
      console.log(`  ${char.name}: brak [Lifestyle] — pomijam`)
      continue
    }

    const oldEntry = equipment[lifestyleIdx]

    // Extract star string (between first space after [Lifestyle] and next space+word)
    const match = oldEntry.match(/^\[Lifestyle\]\s+([^\s]+)\s+(.+)$/)
    if (!match) {
      console.log(`  ${char.name}: nie można sparsować — "${oldEntry}"`)
      continue
    }

    const oldStarStr = match[1]
    const rating = parseOldStars(oldStarStr)
    const newStars = newStarString(rating)
    const newLabel = inferLifestyleLabel(char.spending_level, rating)
    const newEntry = `[Lifestyle] ${newStars} ${newLabel}`

    if (oldEntry === newEntry) {
      console.log(`  ${char.name}: już poprawny — "${oldEntry}"`)
      continue
    }

    console.log(`  ${char.name}:`)
    console.log(`    Stary: "${oldEntry}"`)
    console.log(`    Nowy:  "${newEntry}"`)

    const newEquipment = [...equipment]
    newEquipment[lifestyleIdx] = newEntry

    // Update character
    const updateRes = await fetch(`${ADMIN_URL}/characters/${char.id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ equipment: newEquipment }),
    })

    if (!updateRes.ok) {
      console.error(`    BŁĄD: ${await updateRes.text()}`)
    } else {
      console.log(`    ✓ Zaktualizowano`)
      fixed++
    }
  }

  console.log(`\nGotowe. Zaktualizowano ${fixed} postaci.`)
}

main()
