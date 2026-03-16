import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { OCCUPATIONS } from '@/data/occupations'
import { getSkillDisplayName, getSkillBase } from '@/data/skills'
import { WEAPONS } from '@/data/weapons'
import type { CharacteristicKey } from '@/types/common'
import { halfValue, fifthValue } from '@/lib/utils'

const CHAR_LABELS: Record<CharacteristicKey, string> = {
  STR: 'SIŁ', CON: 'KON', SIZ: 'BC', DEX: 'ZR', APP: 'WYG', INT: 'INT', POW: 'MOC', EDU: 'WYK',
}

interface ExportCharacter {
  name: string
  age: number
  gender: string
  appearance: string
  characteristics: Record<string, number>
  luck: number
  derived: Record<string, unknown>
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Record<string, unknown>
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: string
  method: string
  player_name?: string
  invite_code?: string
}

type Derived = {
  hp: number; mp: number; san: number
  db: string; build: number; move_rate: number; dodge: number
}

function resolveBase(skillKey: string, chars: Record<string, number>): number {
  const base = getSkillBase(skillKey)
  if (base === 'half_dex') return Math.floor((chars['DEX'] ?? 0) / 2)
  if (base === 'edu') return chars['EDU'] ?? 0
  return base
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  // Estimate max chars as safety fallback (avgCharWidth ≈ size * 0.5)
  const maxChars = Math.floor(maxWidth / (size * 0.5))
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    const tooWide = font.widthOfTextAtSize(test, size) > maxWidth
    const tooLong = test.length > maxChars
    if ((tooWide || tooLong) && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function extractFromEquipment(equipment: string[], prefix: string): string | null {
  const item = equipment.find(e => e.startsWith(prefix))
  return item ? item.replace(prefix, '').trim() : null
}

// ============================================================
//  Layout constants
// ============================================================
const W = 595
const H = 842
const M = 28
const CW = W - 2 * M

const DARK = rgb(0.15, 0.15, 0.15)
const MID = rgb(0.4, 0.4, 0.4)
const LIGHT = rgb(0.82, 0.82, 0.82)
const ACCENT = rgb(0.2, 0.35, 0.2)
const ROW_BG = rgb(0.95, 0.95, 0.95)

// ============================================================
//  Drawing primitives
// ============================================================

function sectionHeader(page: PDFPage, title: string, x: number, y: number, w: number, font: PDFFont): number {
  page.drawRectangle({ x, y: y - 12, width: w, height: 12, color: ACCENT })
  page.drawText(title, { x: x + 4, y: y - 9.5, size: 7.5, font, color: rgb(1, 1, 1) })
  return y - 12
}

function drawBox(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: LIGHT, borderWidth: 0.5, color: rgb(0.97, 0.97, 0.97) })
}

function textInBox(page: PDFPage, text: string, x: number, y: number, w: number, h: number, font: PDFFont, size: number) {
  drawBox(page, x, y, w, h)
  const tw = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: x + (w - tw) / 2, y: y + (h - size) / 2, size, font, color: DARK })
}

// ============================================================
//  Single-page builder
// ============================================================

function buildPage(page: PDFPage, font: PDFFont, fontBold: PDFFont, char: ExportCharacter, derived: Derived) {
  let y = H - M

  const lv = (label: string, value: string, x: number, yy: number, lw: number) => {
    page.drawText(label, { x, y: yy, size: 7, font, color: MID })
    page.drawText(value, { x: x + lw, y: yy, size: 8, font: fontBold, color: DARK })
  }

  // ── Title bar ──
  page.drawRectangle({ x: M, y: y - 18, width: CW, height: 18, color: DARK })
  page.drawText('KARTA BADACZA  ·  Zew Cthulhu 7ed', { x: M + 5, y: y - 13.5, size: 9, font: fontBold, color: rgb(1, 1, 1) })
  const eraLabel = char.era === 'classic_1920s' ? '1920s' : char.era === 'modern' ? 'Współczesność' : char.era
  page.drawText(eraLabel, { x: M + CW - 70, y: y - 13.5, size: 8, font, color: rgb(0.7, 0.7, 0.7) })
  y -= 18

  // ── Extra spacing (user requested +1 line break) ──
  y -= 14

  // ── Personal info (2-column grid, uniform tab) ──
  const occupation = OCCUPATIONS.find(o => o.id === char.occupation_id)
  const sexLabel = char.gender === 'M' ? 'Mężczyzna' : char.gender === 'F' ? 'Kobieta' : char.gender
  const housing = extractFromEquipment(char.equipment, '[Mieszkanie]')
  const transport = extractFromEquipment(char.equipment, '[Transport]')
  const lifestyle = extractFromEquipment(char.equipment, '[Styl życia]') ?? extractFromEquipment(char.equipment, '[Styl zycia]')

  const col1 = M
  const col2 = M + CW / 2
  const TAB = 62 // uniform label→value offset

  if (char.player_name) lv('Gracz:', char.player_name, col1, y, TAB)
  if (char.invite_code) lv('Kod:', char.invite_code, col2, y, TAB)
  if (char.player_name || char.invite_code) y -= 12
  lv('Imię:', char.name, col1, y, TAB)
  lv('Wiek:', String(char.age), col2, y, TAB)
  y -= 12
  lv('Zawód:', occupation?.name ?? char.occupation_id, col1, y, TAB)
  lv('Płeć:', sexLabel, col2, y, TAB)
  y -= 12
  if (housing) lv('Mieszkanie:', housing, col1, y, TAB)
  if (transport) lv('Transport:', transport, col2, y, TAB)
  y -= 12
  if (char.appearance) {
    page.drawText('Wygląd:', { x: col1, y, size: 7, font, color: MID })
    const appMaxW = CW - TAB
    const appLines = wrapText(char.appearance, fontBold, 8, appMaxW)
    for (const line of appLines) {
      page.drawText(line, { x: col1 + TAB, y, size: 8, font: fontBold, color: DARK })
      y -= 12
    }
  }
  y -= 2

  // ── Characteristics (single row of 8) ──
  y = sectionHeader(page, 'CECHY', M, y, CW, fontBold)
  y -= 2

  const charKeys: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']
  const charBlockW = CW / 8
  for (let i = 0; i < 8; i++) {
    const key = charKeys[i]
    const val = char.characteristics[key] ?? 0
    const cx = M + i * charBlockW

    page.drawText(CHAR_LABELS[key], { x: cx + 2, y: y - 9, size: 6.5, font: fontBold, color: MID })
    textInBox(page, String(val), cx + 2, y - 24, 22, 13, fontBold, 9)
    textInBox(page, String(halfValue(val)), cx + 26, y - 24, 18, 13, font, 7)
    textInBox(page, String(fifthValue(val)), cx + 46, y - 24, 18, 13, font, 7)
  }
  y -= 26

  // ── Derived stats row ──
  y -= 3
  const dItems = [
    ['PW', String(derived.hp)], ['PP', String(derived.san)], ['PM', String(derived.mp)],
    ['Szczęście', String(char.luck)], ['MO', derived.db], ['Krzepa', String(derived.build)],
    ['Ruch', String(derived.move_rate)], ['Unik', String(derived.dodge)],
  ]
  const dColW = CW / dItems.length
  for (let i = 0; i < dItems.length; i++) {
    const dx = M + i * dColW
    page.drawText(dItems[i][0], { x: dx + 1, y: y - 8, size: 6, font, color: MID })
    page.drawText(dItems[i][1], { x: dx + 1, y: y - 18, size: 8, font: fontBold, color: DARK })
  }
  y -= 22

  // ── Skills (3-column) ──
  y = sectionHeader(page, 'UMIEJĘTNOŚCI', M, y, CW, fontBold)
  y -= 1

  const allPts: Record<string, number> = { ...char.occupation_skill_points }
  for (const [id, pts] of Object.entries(char.personal_skill_points)) {
    allPts[id] = (allPts[id] ?? 0) + pts
  }
  const skillEntries = Object.entries(allPts)
    .filter(([, p]) => p > 0)
    .map(([sid, pts]) => ({
      name: getSkillDisplayName(sid),
      total: resolveBase(sid, char.characteristics) + pts,
      half: halfValue(resolveBase(sid, char.characteristics) + pts),
      fifth: fifthValue(resolveBase(sid, char.characteristics) + pts),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))

  const numCols = 3
  const skillColW = CW / numCols
  const skillRowH = 10
  const rowsPerCol = Math.ceil(skillEntries.length / numCols)

  for (let row = 0; row < rowsPerCol; row++) {
    if (y - skillRowH < M) break
    for (let col = 0; col < numCols; col++) {
      const idx = col * rowsPerCol + row
      if (idx >= skillEntries.length) continue
      const s = skillEntries[idx]
      const sx = M + col * skillColW

      if (row % 2 === 0) {
        page.drawRectangle({ x: sx, y: y - skillRowH, width: skillColW - 2, height: skillRowH, color: ROW_BG })
      }

      page.drawText(s.name, { x: sx + 2, y: y - skillRowH + 2.5, size: 6.5, font, color: DARK })
      page.drawText(String(s.total), { x: sx + skillColW - 42, y: y - skillRowH + 2.5, size: 6.5, font: fontBold, color: DARK })
      page.drawText(String(s.half), { x: sx + skillColW - 28, y: y - skillRowH + 2.5, size: 6, font, color: MID })
      page.drawText(String(s.fifth), { x: sx + skillColW - 14, y: y - skillRowH + 2.5, size: 6, font, color: MID })
    }
    y -= skillRowH
  }
  y -= 4

  // ── Weapons ──
  const weaponItems: { name: string; skill: number; damage: string; range: string }[] = []
  for (const item of char.equipment) {
    const matched = WEAPONS.find(w => item.startsWith(w.name))
    if (matched) {
      const invested = (char.occupation_skill_points[matched.skill_id] ?? 0) + (char.personal_skill_points[matched.skill_id] ?? 0)
      const base = resolveBase(matched.skill_id, char.characteristics)
      weaponItems.push({ name: matched.name, skill: base + invested, damage: matched.damage, range: matched.range })
    }
  }

  if (weaponItems.length > 0) {
    y = sectionHeader(page, 'UZBROJENIE', M, y, CW, fontBold)
    y -= 1
    page.drawText('Broń', { x: M + 2, y: y - 8, size: 6, font, color: MID })
    page.drawText('Zw.', { x: M + 150, y: y - 8, size: 6, font, color: MID })
    page.drawText('Tr.', { x: M + 180, y: y - 8, size: 6, font, color: MID })
    page.drawText('Ek.', { x: M + 210, y: y - 8, size: 6, font, color: MID })
    page.drawText('Obrażenia', { x: M + 250, y: y - 8, size: 6, font, color: MID })
    page.drawText('Zasięg', { x: M + 350, y: y - 8, size: 6, font, color: MID })
    y -= 10

    for (const w of weaponItems) {
      if (y - 10 < M) break
      page.drawText(w.name, { x: M + 2, y: y - 8, size: 6.5, font, color: DARK })
      page.drawText(String(w.skill), { x: M + 152, y: y - 8, size: 6.5, font: fontBold, color: DARK })
      page.drawText(String(halfValue(w.skill)), { x: M + 182, y: y - 8, size: 6.5, font, color: MID })
      page.drawText(String(fifthValue(w.skill)), { x: M + 212, y: y - 8, size: 6.5, font, color: MID })
      page.drawText(w.damage, { x: M + 250, y: y - 8, size: 6.5, font, color: DARK })
      page.drawText(w.range, { x: M + 350, y: y - 8, size: 6.5, font, color: DARK })
      y -= 10
    }
    y -= 2
  }

  // ── Backstory (inline label: value) ──
  y = sectionHeader(page, 'HISTORIA POSTACI', M, y, CW, fontBold)
  y -= 2

  const bsSections = [
    { label: 'Ideologia/Przekonania', key: 'ideology' },
    { label: 'Ważne osoby', key: 'significant_people_who' },
    { label: 'Dlaczego są ważne', key: 'significant_people_why' },
    { label: 'Znaczące miejsca', key: 'meaningful_locations' },
    { label: 'Cenny przedmiot', key: 'treasured_possessions' },
    { label: 'Cechy charakteru', key: 'traits' },
    { label: 'Wygląd', key: 'appearance_description' },
    { label: 'Kluczowa więź', key: 'key_connection' },
  ]

  for (const section of bsSections) {
    const value = char.backstory[section.key]
    if (!value || typeof value !== 'string') continue
    if (y < M + 10) break

    const labelText = section.label + ': '
    const labelW = fontBold.widthOfTextAtSize(labelText, 7)
    page.drawText(labelText, { x: M + 2, y: y - 9, size: 7, font: fontBold, color: ACCENT })

    // First line starts after label
    const firstLineMaxW = CW - 6 - labelW
    const words = value.split(/\s+/)
    let firstLine = ''
    let wordIdx = 0
    for (; wordIdx < words.length; wordIdx++) {
      const test = firstLine ? `${firstLine} ${words[wordIdx]}` : words[wordIdx]
      if (font.widthOfTextAtSize(test, 7) > firstLineMaxW && firstLine) break
      firstLine = test
    }
    page.drawText(firstLine, { x: M + 2 + labelW, y: y - 9, size: 7, font, color: DARK })
    y -= 10

    // Overflow lines
    const remaining = words.slice(wordIdx).join(' ')
    if (remaining) {
      const lines = wrapText(remaining, font, 7, CW - 10)
      for (const line of lines) {
        if (y < M + 10) break
        page.drawText(line, { x: M + 6, y: y - 9, size: 7, font, color: DARK })
        y -= 10
      }
    }
  }
  y -= 4

  // ── Equipment + Wealth side by side ──
  const nonWeapons = char.equipment.filter(
    item => !WEAPONS.some(w => item.startsWith(w.name)) &&
      !item.startsWith('[Mieszkanie]') &&
      !item.startsWith('[Transport]') &&
      !item.startsWith('[Styl')
  )

  const halfW = CW / 2 - 4

  if (nonWeapons.length > 0 || char.cash || char.assets) {
    const headerY = y
    y = sectionHeader(page, 'EKWIPUNEK', M, headerY, halfW, fontBold)
    sectionHeader(page, 'MAJĄTEK', M + halfW + 8, headerY, halfW, fontBold)
    y -= 2

    // Equipment (left)
    const eqStartY = y
    for (let i = 0; i < nonWeapons.length; i++) {
      if (y - 9 < M) break
      page.drawText(`· ${nonWeapons[i]}`, { x: M + 3, y: y - 8, size: 6.5, font, color: DARK })
      y -= 9
    }

    // Wealth (right)
    let wy = eqStartY
    const rx = M + halfW + 10
    if (lifestyle) {
      page.drawText(`Styl życia: ${lifestyle}`, { x: rx, y: wy - 8, size: 7, font, color: DARK })
      wy -= 10
    }
    if (char.spending_level) {
      page.drawText(`Poziom wydatków: ${char.spending_level}`, { x: rx, y: wy - 8, size: 7, font, color: DARK })
      wy -= 10
    }
    if (char.cash) {
      page.drawText(`Gotówka: ${char.cash}`, { x: rx, y: wy - 8, size: 7, font, color: DARK })
      wy -= 10
    }
    if (char.assets) {
      page.drawText(`Dobytek: ${char.assets}`, { x: rx, y: wy - 8, size: 7, font, color: DARK })
    }
  }
}

// ============================================================
//  Main export
// ============================================================

export async function exportCharacterAsPdf(char: ExportCharacter): Promise<Uint8Array> {
  const derived = char.derived as Derived
  const pdfDoc = await PDFDocument.create()

  pdfDoc.registerFontkit(fontkit as Parameters<typeof pdfDoc.registerFontkit>[0])

  const [regularBytes, boldBytes] = await Promise.all([
    fetch(import.meta.env.BASE_URL + 'fonts/Inter-Regular.ttf').then(r => r.arrayBuffer()),
    fetch(import.meta.env.BASE_URL + 'fonts/Inter-Bold.ttf').then(r => r.arrayBuffer()),
  ])

  const font = await pdfDoc.embedFont(regularBytes, { subset: true })
  const fontBold = await pdfDoc.embedFont(boldBytes, { subset: true })

  const page = pdfDoc.addPage([W, H])
  buildPage(page, font, fontBold, char, derived)

  return pdfDoc.save()
}
