#!/usr/bin/env node
/**
 * Renders the v2 character card HTML template (`public/templates/card_front_v2.html`)
 * to two outputs:
 *
 *  1. `public/karta_front_v2.pdf` — A4 PDF with the static card frame only
 *     (all dynamic value cells are blanked out post-render). Embedded as
 *     background by `src/lib/exportCardPdf.ts`.
 *
 *  2. `scripts/output/card-v2-fields.json` — bounding boxes (% of A4) for
 *     every dynamic field, captured via `getBoundingClientRect()`. Source
 *     of truth for `FRONT_V2_FIELDS` / `FRONT_V2_SKILL_GRIDS` in
 *     `src/data/cardFieldLayouts.ts`.
 *
 * Run once whenever the HTML template changes. Output PDF is committed.
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HTML_PATH = path.join(ROOT, 'public', 'templates', 'card_front_v2.html')
const PDF_OUT = path.join(ROOT, 'public', 'karta_front_v2.pdf')
const JSON_OUT = path.join(ROOT, 'scripts', 'output', 'card-v2-fields.json')
const TS_OUT = path.join(ROOT, 'src', 'data', 'cardFrontV2.generated.ts')

const NORMAL_SKILL_KEYS = [
  'anthropology', 'archaeology', 'disguise', 'electrical', 'fast_talk',
  'history', 'ride', 'lang_own', 'library_use', 'accounting',
  'credit_rating', 'mechanical', 'medicine', 'cthulhu_mythos', 'listen',
  'navigate', 'heavy_machinery', 'occult', 'persuade', 'first_aid',
  'swim', 'law', 'drive_auto', 'psychoanalysis', 'psychology',
  'throw', 'jump', 'spot_hidden', 'survival', 'locksmith',
  'track', 'stealth', 'dodge', 'appearance_skill', 'natural_world',
  'climb', 'appraise', 'intimidate', 'sleight_of_hand',
]

const SPEC_SLOT_KEYS = [
  // Broń Palna fixed (5)
  { skill_id: 'bron_palna:krotka', kind: 'fixed' },
  { skill_id: 'bron_palna:karabin_strzelba', kind: 'fixed' },
  { skill_id: 'bron_palna:pistolet_maszynowy', kind: 'fixed' },
  { skill_id: 'bron_palna:bron_ciezka', kind: 'fixed' },
  { skill_id: 'bron_palna:luk_kusza', kind: 'fixed' },
  // Walka Wręcz fixed (4)
  { skill_id: 'walka_wrecz:bijatyka', kind: 'fixed' },
  { skill_id: 'walka_wrecz:dluga_ostra', kind: 'fixed' },
  { skill_id: 'walka_wrecz:bron_obuchowa', kind: 'fixed' },
  { skill_id: 'walka_wrecz:skrytobojstwo', kind: 'fixed' },
  // Sztuka/Rzemiosło open (3)
  { skill_id: 'sztuka_rzemioslo:_open1', kind: 'open_spec', parent: 'sztuka_rzemioslo' },
  { skill_id: 'sztuka_rzemioslo:_open2', kind: 'open_spec', parent: 'sztuka_rzemioslo' },
  { skill_id: 'sztuka_rzemioslo:_open3', kind: 'open_spec', parent: 'sztuka_rzemioslo' },
  // Nauka open (3)
  { skill_id: 'nauka:_open1', kind: 'open_spec', parent: 'nauka' },
  { skill_id: 'nauka:_open2', kind: 'open_spec', parent: 'nauka' },
  { skill_id: 'nauka:_open3', kind: 'open_spec', parent: 'nauka' },
  // Język Obcy open (3)
  { skill_id: 'jezyk_obcy:_open1', kind: 'open_spec', parent: 'jezyk_obcy' },
  { skill_id: 'jezyk_obcy:_open2', kind: 'open_spec', parent: 'jezyk_obcy' },
  { skill_id: 'jezyk_obcy:_open3', kind: 'open_spec', parent: 'jezyk_obcy' },
]

const WEAPON_COLS = ['name', 'norm', 'hard', 'extreme', 'damage', 'range', 'attacks', 'ammo', 'reliability']

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 } })
  const page = await ctx.newPage()

  // Pre-empt the inline script's character defaults — this fires before page scripts.
  await page.addInitScript(() => {
    window.character = {
      chars: { str: 0, dex: 0, pow: 0, con: 0, app: 0, edu: 0, siz: 0, int: 0, move: 0 },
      skills: {},
      weapons: [],
      san: {}, hp: {}, luck: {}, mp: {},
    }
  })

  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: 'networkidle' })

  // PHASE 1 — populate every dynamic field with a placeholder so inline spans
  // have a real line-height when measured. (Empty `<span class="val">` collapses
  // to ~0px height.) Then capture bounding boxes.
  await page.evaluate(() => {
    document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = '00' })
    document.querySelectorAll('.skill .v, .skill .e, .skill .h, .skill .f').forEach((el) => { el.textContent = '00' })
    const tbl = document.getElementById('weapons-table')
    if (tbl) {
      Array.from(tbl.children).slice(9).forEach((el) => { el.textContent = '—' })
    }
    // Populate empty open-spec name slots so their inline-blocks have real heights.
    document.querySelectorAll('.skill .nm .ed').forEach((el) => {
      if (!el.textContent.trim()) el.textContent = 'placeholder'
    })
    const tb = document.getElementById('toolbar')
    if (tb) tb.style.display = 'none'
  })

  // Capture coordinates relative to the .card element (which is exactly A4).
  const fields = await page.evaluate(({ NORMAL_SKILL_KEYS, SPEC_SLOT_KEYS, WEAPON_COLS }) => {
    const cardEl = document.querySelector('.card')
    const cardRect = cardEl.getBoundingClientRect()

    const toPct = (rect) => ({
      x: +(((rect.left - cardRect.left) / cardRect.width) * 100).toFixed(3),
      y: +(((rect.top - cardRect.top) / cardRect.height) * 100).toFixed(3),
      w: +((rect.width / cardRect.width) * 100).toFixed(3),
      h: +((rect.height / cardRect.height) * 100).toFixed(3),
    })

    const fields = []

    // 1. data-bind fields (name, occupation, hp.max, etc.)
    document.querySelectorAll('[data-bind]').forEach((el) => {
      fields.push({ id: el.dataset.bind, kind: 'bind', ...toPct(el.getBoundingClientRect()) })
    })

    // 2. Portrait
    const portrait = document.getElementById('portrait-frame')
    if (portrait) fields.push({ id: 'photo', kind: 'portrait', ...toPct(portrait.getBoundingClientRect()) })

    // 3. Chars 3x3 — main + half + fifth
    const charKeys = ['str', 'dex', 'pow', 'con', 'app', 'edu', 'siz', 'int', 'move']
    document.querySelectorAll('.char-cell').forEach((cell, i) => {
      const key = charKeys[i]
      const main = cell.querySelector('.main')
      const easy = cell.querySelector('.sub .easy')
      const half = cell.querySelector('.sub .half')
      const fifth = cell.querySelector('.sub .fifth')
      if (main) fields.push({ id: `char_${key}`, kind: 'char', ...toPct(main.getBoundingClientRect()) })
      if (key === 'move') {
        // Move cell's sub-slots are repurposed for walk/sprint hex/round speed.
        // (The easy slot stays empty for move — there is no easy-test movement.)
        if (half) fields.push({ id: 'walk_speed_hex', kind: 'char', ...toPct(half.getBoundingClientRect()) })
        if (fifth) fields.push({ id: 'sprint_speed_hex', kind: 'char', ...toPct(fifth.getBoundingClientRect()) })
      } else {
        if (easy) fields.push({ id: `char_${key}_easy`, kind: 'char', ...toPct(easy.getBoundingClientRect()) })
        if (half) fields.push({ id: `char_${key}_half`, kind: 'char', ...toPct(half.getBoundingClientRect()) })
        if (fifth) fields.push({ id: `char_${key}_fifth`, kind: 'char', ...toPct(fifth.getBoundingClientRect()) })
      }
    })

    // 4. Skills — normal grid (3 cols, 13×3 rows). The DOM order is column-major
    // because `renderSkills` pushes per column. So row index maps to NORMAL_SKILLS.
    const normalRows = document.querySelectorAll('.skills-grid .skill')
    normalRows.forEach((row, i) => {
      const skillKey = NORMAL_SKILL_KEYS[i]
      if (!skillKey) return
      const cb = row.querySelector('.cb')
      const v = row.querySelector('.v')
      const e = row.querySelector('.e')
      const h = row.querySelector('.h')
      const f = row.querySelector('.f')
      if (cb) fields.push({ id: `skill_${skillKey}_cb`, kind: 'skill_cb', skillKey, ...toPct(cb.getBoundingClientRect()) })
      if (v) fields.push({ id: `skill_${skillKey}_v`, kind: 'skill', skillKey, ...toPct(v.getBoundingClientRect()) })
      if (e) fields.push({ id: `skill_${skillKey}_e`, kind: 'skill', skillKey, ...toPct(e.getBoundingClientRect()) })
      if (h) fields.push({ id: `skill_${skillKey}_h`, kind: 'skill', skillKey, ...toPct(h.getBoundingClientRect()) })
      if (f) fields.push({ id: `skill_${skillKey}_f`, kind: 'skill', skillKey, ...toPct(f.getBoundingClientRect()) })
    })

    // 5. Specializations — 2-col grid. DOM has 18 named rows + 4 trailing
    // blank rows (2 per column). Filter to the 18 named — they're the only
    // ones in SPEC_SLOT_KEYS.
    const specRows = [...document.querySelectorAll('.skills-spec-grid .skill')]
      .filter((row) => !row.querySelector('.nm .ed.wide'))
    specRows.forEach((row, i) => {
      const slot = SPEC_SLOT_KEYS[i]
      if (!slot) return
      const cb = row.querySelector('.cb')
      const nm = row.querySelector('.nm .ed')
      const v = row.querySelector('.v')
      const e = row.querySelector('.e')
      const h = row.querySelector('.h')
      const f = row.querySelector('.f')
      if (cb) fields.push({ id: `spec_${slot.skill_id}_cb`, kind: 'spec_cb', skill_id: slot.skill_id, slot_kind: slot.kind, parent: slot.parent, ...toPct(cb.getBoundingClientRect()) })
      if (nm && slot.kind === 'open_spec') fields.push({ id: `spec_${slot.skill_id}_name`, kind: 'spec_name', skill_id: slot.skill_id, parent: slot.parent, ...toPct(nm.getBoundingClientRect()) })
      if (v) fields.push({ id: `spec_${slot.skill_id}_v`, kind: 'spec', skill_id: slot.skill_id, slot_kind: slot.kind, parent: slot.parent, ...toPct(v.getBoundingClientRect()) })
      if (e) fields.push({ id: `spec_${slot.skill_id}_e`, kind: 'spec', skill_id: slot.skill_id, slot_kind: slot.kind, parent: slot.parent, ...toPct(e.getBoundingClientRect()) })
      if (h) fields.push({ id: `spec_${slot.skill_id}_h`, kind: 'spec', skill_id: slot.skill_id, slot_kind: slot.kind, parent: slot.parent, ...toPct(h.getBoundingClientRect()) })
      if (f) fields.push({ id: `spec_${slot.skill_id}_f`, kind: 'spec', skill_id: slot.skill_id, slot_kind: slot.kind, parent: slot.parent, ...toPct(f.getBoundingClientRect()) })
    })

    // 6. Weapons — 5 rows × 9 cols (skip the 9 header cells).
    const tbl = document.getElementById('weapons-table')
    if (tbl) {
      const cells = Array.from(tbl.children).slice(9)
      cells.forEach((cell, i) => {
        const row = Math.floor(i / 9) + 1
        const col = WEAPON_COLS[i % 9]
        fields.push({ id: `weap${row}_${col}`, kind: 'weapon', ...toPct(cell.getBoundingClientRect()) })
      })
    }

    return fields
  }, { NORMAL_SKILL_KEYS, SPEC_SLOT_KEYS, WEAPON_COLS })

  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true })
  fs.writeFileSync(JSON_OUT, JSON.stringify(fields, null, 2))
  console.log(`[ok] Field layout written: ${path.relative(ROOT, JSON_OUT)} (${fields.length} entries)`)

  emitTypedLayout(fields)
  console.log(`[ok] TS layout written: ${path.relative(ROOT, TS_OUT)}`)

  // PHASE 2 — blank every dynamic field, then render the static frame to PDF.
  await page.evaluate(() => {
    document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = '' })
    document.querySelectorAll('.char-cell .main').forEach((el) => { el.textContent = '' })
    document.querySelectorAll('.char-cell .sub > div').forEach((el) => { el.textContent = '' })
    document.querySelectorAll('.skill .v, .skill .e, .skill .h, .skill .f').forEach((el) => { el.textContent = '' })
    // Clear the placeholder strings injected in PHASE 1 — these would
    // otherwise bake "placeholder" text into the PDF background for every
    // open_spec slot AND every trailing blank row.
    document.querySelectorAll('.skill .nm .ed.empty, .skill .nm .ed.wide').forEach((el) => { el.textContent = '' })
    const tbl = document.getElementById('weapons-table')
    if (tbl) {
      Array.from(tbl.children).slice(9).forEach((el) => { el.textContent = '' })
    }
  })

  fs.mkdirSync(path.dirname(PDF_OUT), { recursive: true })
  await page.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  })
  console.log(`[ok] PDF written: ${path.relative(ROOT, PDF_OUT)}`)

  await browser.close()
}

// ── TypeScript emit ────────────────────────────────────────────────────────

// fontSize values are actual pt — both BG and overlay are vector, so direct match.
const FIELD_META = {
  // bind id → { label, fontSize, align?, bold?, maxLines? }
  'name':         { label: 'Imię Badacza',          fontSize: 12, bold: true },
  'player_name':  { label: 'Gracz',                 fontSize: 11 },
  'occupation':   { label: 'Zawód',                 fontSize: 11 },
  'age':          { label: 'Wiek',                  fontSize: 11 },
  'gender':       { label: 'Płeć',                  fontSize: 11 },
  'birthplace':   { label: 'Miejsce urodzenia',     fontSize: 11 },
  'residence':    { label: 'Miejsce zamieszkania',  fontSize: 11 },
  'death_place':  { label: 'Miejsce śmierci',       fontSize: 11 },
  'san.max':      { label: 'Poczytalność MAX',      fontSize: 12, align: 'center', bold: true },
  'san.curr':     { label: 'Poczytalność OBECNA',   fontSize: 12, align: 'center', bold: true },
  'san.fifth':    { label: 'Poczytalność 1/5',      fontSize: 12, align: 'center', bold: true },
  'hp.max':       { label: 'Wytrzymałość MAX',      fontSize: 12, align: 'center', bold: true },
  'hp.curr':      { label: 'Wytrzymałość OBECNE',   fontSize: 12, align: 'center', bold: true },
  'luck.max':     { label: 'Szczęście MAX',         fontSize: 12, align: 'center', bold: true },
  'luck.curr':    { label: 'Szczęście OBECNE',      fontSize: 12, align: 'center', bold: true },
  'mp.max':       { label: 'PM MAX',                fontSize: 12, align: 'center', bold: true },
  'mp.curr':      { label: 'PM OBECNE',             fontSize: 12, align: 'center', bold: true },
  'damage_bonus': { label: 'Mod. obrażeń',          fontSize: 11, align: 'center', bold: true },
  'build':        { label: 'Krzepa',                fontSize: 11, align: 'center', bold: true },
  'dodge':        { label: 'Unik',                  fontSize: 11, align: 'center', bold: true },
  'walk':         { label: 'Chód (heks/r)',         fontSize: 11, align: 'center', bold: true },
  'sprint':       { label: 'Sprint (heks/r)',       fontSize: 11, align: 'center', bold: true },
}

const CHAR_LABELS = {
  str: 'SIŁ', dex: 'ZRĘ', pow: 'MOC',
  con: 'KON', app: 'WYG', edu: 'WYK',
  siz: 'BUD', int: 'INT', move: 'RUCH',
}

function fieldBoxLine(f, label, fontSize, align, bold) {
  const parts = [
    `id: '${f.id}'`,
    `label: '${label.replace(/'/g, "\\'")}'`,
    `x: ${f.x}`,
    `y: ${f.y}`,
    `w: ${f.w}`,
    `h: ${f.h}`,
    `fontSize: ${fontSize}`,
  ]
  if (align) parts.push(`align: '${align}'`)
  if (bold) parts.push(`bold: true`)
  return `  { ${parts.join(', ')} },`
}

function emitTypedLayout(fields) {
  const lines = []
  lines.push('// AUTO-GENERATED by scripts/render-card-frame-v2.mjs — do not edit manually.')
  lines.push("// Source of truth: public/templates/card_front_v2.html")
  lines.push('')
  lines.push("import type { FieldBox } from './cardFieldLayouts'")
  lines.push("import type { SkillRowV2, SpecRowV2 } from './cardFrontV2.types'")
  lines.push('')

  // ── FieldBox[] for portrait + bind + char ───────────────────────────────
  lines.push('export const FRONT_V2_FIELDS: FieldBox[] = [')

  // Portrait
  const portrait = fields.find((f) => f.kind === 'portrait')
  if (portrait) {
    lines.push(fieldBoxLine(portrait, 'Zdjęcie', 8, 'center'))
  }

  // Char main + half + fifth (no move sub — those are walk/sprint)
  const charKeys = ['str', 'dex', 'pow', 'con', 'app', 'edu', 'siz', 'int', 'move']
  for (const key of charKeys) {
    const main = fields.find((f) => f.id === `char_${key}`)
    if (main) lines.push(fieldBoxLine(main, CHAR_LABELS[key], 16, 'center', true))
    if (key !== 'move') {
      const easy = fields.find((f) => f.id === `char_${key}_easy`)
      const half = fields.find((f) => f.id === `char_${key}_half`)
      const fifth = fields.find((f) => f.id === `char_${key}_fifth`)
      if (easy) lines.push(fieldBoxLine(easy, `${CHAR_LABELS[key]} ×2`, 8, 'center'))
      if (half) lines.push(fieldBoxLine(half, `${CHAR_LABELS[key]} ½`, 8, 'center'))
      if (fifth) lines.push(fieldBoxLine(fifth, `${CHAR_LABELS[key]} ⅕`, 8, 'center'))
    }
  }

  // walk_speed_hex + sprint_speed_hex (move cell sub-slots)
  const wsh = fields.find((f) => f.id === 'walk_speed_hex')
  const ssh = fields.find((f) => f.id === 'sprint_speed_hex')
  if (wsh) lines.push(fieldBoxLine(wsh, 'Heks/r (chód)', 9, 'center', true))
  if (ssh) lines.push(fieldBoxLine(ssh, 'Heks/r (sprint)', 9, 'center', true))

  // bind fields (in declaration order from FIELD_META)
  for (const id of Object.keys(FIELD_META)) {
    const f = fields.find((x) => x.id === id)
    if (!f) continue
    const meta = FIELD_META[id]
    lines.push(fieldBoxLine(f, meta.label, meta.fontSize, meta.align, meta.bold))
  }

  // weapon cells
  for (let row = 1; row <= 5; row++) {
    for (const col of WEAPON_COLS) {
      const f = fields.find((x) => x.id === `weap${row}_${col}`)
      if (!f) continue
      const colLabels = {
        name: 'broń', norm: 'norm.', hard: 'wym.', extreme: 'eks.',
        damage: 'obrażenia', range: 'zasięg', attacks: 'ataki', ammo: 'amu.', reliability: 'zaw.',
      }
      const align = col === 'name' ? 'left' : 'center'
      const fontSize = col === 'name' ? 9 : 8
      lines.push(fieldBoxLine(f, `Broń ${row} ${colLabels[col]}`, fontSize, align))
    }
  }

  lines.push(']')
  lines.push('')

  // ── SkillRowV2[] ────────────────────────────────────────────────────────
  lines.push('export const FRONT_V2_SKILL_ROWS: SkillRowV2[] = [')
  for (const key of NORMAL_SKILL_KEYS) {
    const cb = fields.find((f) => f.id === `skill_${key}_cb`)
    const v = fields.find((f) => f.id === `skill_${key}_v`)
    const e = fields.find((f) => f.id === `skill_${key}_e`)
    const h = fields.find((f) => f.id === `skill_${key}_h`)
    const f = fields.find((x) => x.id === `skill_${key}_f`)
    if (!cb || !v || !e || !h || !f) continue
    lines.push(`  { skillKey: '${key}', cb: { x: ${cb.x}, y: ${cb.y}, w: ${cb.w}, h: ${cb.h} }, v: { x: ${v.x}, y: ${v.y}, w: ${v.w}, h: ${v.h} }, easy: { x: ${e.x}, y: ${e.y}, w: ${e.w}, h: ${e.h} }, half: { x: ${h.x}, y: ${h.y}, w: ${h.w}, h: ${h.h} }, fifth: { x: ${f.x}, y: ${f.y}, w: ${f.w}, h: ${f.h} } },`)
  }
  lines.push(']')
  lines.push('')

  // ── SpecRowV2[] ─────────────────────────────────────────────────────────
  lines.push('export const FRONT_V2_SPEC_ROWS: SpecRowV2[] = [')
  for (const slot of SPEC_SLOT_KEYS) {
    const cb = fields.find((f) => f.id === `spec_${slot.skill_id}_cb`)
    const v = fields.find((f) => f.id === `spec_${slot.skill_id}_v`)
    const e = fields.find((f) => f.id === `spec_${slot.skill_id}_e`)
    const h = fields.find((f) => f.id === `spec_${slot.skill_id}_h`)
    const f = fields.find((x) => x.id === `spec_${slot.skill_id}_f`)
    const nm = fields.find((x) => x.id === `spec_${slot.skill_id}_name`)
    if (!cb || !v || !e || !h || !f) continue
    const parts = [
      `skillId: '${slot.skill_id}'`,
      `slotKind: '${slot.kind}'`,
    ]
    if (slot.parent) parts.push(`parent: '${slot.parent}'`)
    parts.push(`cb: { x: ${cb.x}, y: ${cb.y}, w: ${cb.w}, h: ${cb.h} }`)
    // Override captured width on spec name boxes — the inline-block .ed
    // span sized itself to the placeholder text (~7% A4) but real spec
    // names ("Aktorstwo", "Astronomia", "Mat./Krypt.") are wider. Cap
    // at 22% so it never overlaps the value cells starting at ~88.7%.
    if (nm) parts.push(`name: { x: ${nm.x}, y: ${nm.y}, w: 22, h: ${nm.h} }`)
    parts.push(`v: { x: ${v.x}, y: ${v.y}, w: ${v.w}, h: ${v.h} }`)
    parts.push(`easy: { x: ${e.x}, y: ${e.y}, w: ${e.w}, h: ${e.h} }`)
    parts.push(`half: { x: ${h.x}, y: ${h.y}, w: ${h.w}, h: ${h.h} }`)
    parts.push(`fifth: { x: ${f.x}, y: ${f.y}, w: ${f.w}, h: ${f.h} }`)
    lines.push(`  { ${parts.join(', ')} },`)
  }
  lines.push(']')
  lines.push('')

  fs.mkdirSync(path.dirname(TS_OUT), { recursive: true })
  fs.writeFileSync(TS_OUT, lines.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
