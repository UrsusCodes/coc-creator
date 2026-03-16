import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { CARD_LAYOUTS, FRONT_SKILL_GRIDS, type FieldBox, type SkillColumnGrid } from '@/data/cardFieldLayouts'
import { OCCUPATIONS } from '@/data/occupations'
import { getSkillBase, getSkillDisplayName, getBaseSkillId, getSpecialization } from '@/data/skills'
import { halfValue, fifthValue } from '@/lib/utils'
import type { CharacteristicKey } from '@/types/common'

const BASE = import.meta.env.BASE_URL ?? '/'

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

type Derived = { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }

// ── Mapping field IDs → character values ──

const CHAR_KEY_MAP: Record<string, CharacteristicKey> = {
  char_str: 'STR', char_dex: 'DEX', char_pow: 'POW',
  char_con: 'CON', char_app: 'APP', char_edu: 'EDU',
  char_siz: 'SIZ', char_int: 'INT',
}

function resolveBase(skillKey: string, chars: Record<string, number>): number {
  const base = getSkillBase(skillKey)
  if (base === 'half_dex') return Math.floor((chars['DEX'] ?? 0) / 2)
  if (base === 'edu') return chars['EDU'] ?? 0
  return base
}

function getFieldValue(id: string, char: ExportCharacter): string {
  const derived = char.derived as Derived

  // Basic info
  if (id === 'name') return char.name
  if (id === 'player_name') return char.player_name ?? ''
  if (id === 'occupation') return OCCUPATIONS.find((o) => o.id === char.occupation_id)?.name ?? ''
  if (id === 'age') return String(char.age)
  if (id === 'gender') return char.gender
  if (id === 'photo' || id === 'residence' || id === 'birthplace' || id === 'death_place') return ''

  // Characteristics — main values
  if (id === 'char_move') return String(derived.move_rate)
  const charBase = id.replace(/_half$/, '').replace(/_fifth$/, '')
  const charKey = CHAR_KEY_MAP[charBase]
  if (charKey) {
    const val = char.characteristics[charKey] ?? 0
    if (val === 0) return ''
    if (id.endsWith('_half')) return String(halfValue(val))
    if (id.endsWith('_fifth')) return String(fifthValue(val))
    return String(val)
  }

  // Derived
  if (id === 'san') return String(derived.san)
  if (id === 'hp') return String(derived.hp)
  if (id === 'mp') return String(derived.mp)
  if (id === 'luck') return String(char.luck)
  if (id === 'damage_bonus') return String(derived.db)
  if (id === 'build') return String(derived.build)
  if (id === 'dodge') return String(derived.dodge)
  if (id === 'spending_level') return char.spending_level
  if (id === 'cash') return char.cash

  // Weapon fields: weap1_name, weap1_skill, weap1_half, etc.
  // Characters don't have structured weapon data yet — leave empty
  if (id.startsWith('weap')) return ''

  // Spec name fields: spec_bron_palna_1 etc.
  // Handled separately by matchSpecializations
  if (id.startsWith('spec_')) return ''

  // Back card — classic backstory
  if (id === 'appearance_description') return String(char.backstory.appearance_description ?? '')
  if (id === 'ideology') return String(char.backstory.ideology ?? '')
  if (id === 'significant_people') {
    const who = char.backstory.significant_people_who ?? ''
    const why = char.backstory.significant_people_why ?? ''
    return [who, why].filter(Boolean).join('\n')
  }
  if (id === 'meaningful_locations') return String(char.backstory.meaningful_locations ?? '')
  if (id === 'traits') return String(char.backstory.traits ?? '')

  // Back card — ToC
  if (id === 'drive') {
    const driveId = char.backstory.drive as string | undefined
    const detail = char.backstory.drive_detail as string | undefined
    if (!driveId) return ''
    // Import DRIVES inline to get name
    const name = driveId // Will be resolved by the generator
    return detail ? `${name}: ${detail}` : name
  }
  if (id === 'pillars') {
    const p = char.backstory.pillars as string[] | undefined
    return p ? p.filter(Boolean).join('\n') : ''
  }
  if (id === 'sources') {
    const s = char.backstory.sources as { name: string; category: string; description: string }[] | undefined
    return s ? s.map((src) => `${src.name} (${src.category})${src.description ? ' — ' + src.description : ''}`).join('\n') : ''
  }
  if (id === 'other_traits') return String(char.backstory.other_traits ?? '')

  // Bottom section — equipment, assets, position, contacts
  if (id.startsWith('equip_l_') || id.startsWith('equip_r_')) {
    const col = id.startsWith('equip_l_') ? 'l' : 'r'
    const idx = parseInt(id.split('_').pop()!) - 1
    const offset = col === 'r' ? 12 : 0
    return char.equipment[idx + offset] ?? ''
  }
  if (id.startsWith('asset_')) {
    const idx = parseInt(id.split('_').pop()!) - 1
    const assetStr = char.assets
    const items = assetStr.split('\n').map((s) => s.replace(/^[•\-]\s*/, '').trim()).filter(Boolean)
    return items[idx] ?? ''
  }
  // position_ and contact_ — not in character data yet
  if (id.startsWith('position_') || id.startsWith('contact_')) return ''

  return ''
}

// ── Specialization matching ──

function matchSpecializations(char: ExportCharacter): Record<string, string> {
  const result: Record<string, string> = {}
  const allPoints = { ...char.occupation_skill_points }
  for (const [k, v] of Object.entries(char.personal_skill_points)) {
    allPoints[k] = (allPoints[k] ?? 0) + v
  }

  // Group specializations by parent skill
  const specsByParent: Record<string, string[]> = {}
  for (const key of Object.keys(allPoints)) {
    const spec = getSpecialization(key)
    if (!spec) continue
    const base = getBaseSkillId(key)
    if (!specsByParent[base]) specsByParent[base] = []
    specsByParent[base].push(key)
  }

  // Map to open slots
  const slotMap: Record<string, { prefix: string; count: number }> = {
    bron_palna: { prefix: 'spec_bron_palna_', count: 3 },
    jezyk_obcy: { prefix: 'spec_jezyk_obcy_', count: 3 },
    nauka: { prefix: 'spec_nauka_', count: 3 },
    pilotowanie: { prefix: 'spec_pilotaz_', count: 2 },
    sztuka_rzemioslo: { prefix: 'spec_sztuka_', count: 3 },
    walka_wrecz: { prefix: 'spec_walka_', count: 2 },
  }

  // Fixed skills that are already on the card (don't duplicate)
  const fixedSpecs = new Set(['bron_palna:karabin_strzelba', 'bron_palna:krotka', 'walka_wrecz:bijatyka'])

  for (const [parent, slots] of Object.entries(slotMap)) {
    const specs = (specsByParent[parent] ?? []).filter((k) => !fixedSpecs.has(k))
    for (let i = 0; i < slots.count && i < specs.length; i++) {
      const specName = getSpecialization(specs[i])
      // For combat specs, look up display name
      const displayName = getSkillDisplayName(specs[i]).replace(/.*\(/, '').replace(/\)/, '')
      result[`${slots.prefix}${i + 1}`] = displayName || specName || ''
    }
  }

  return result
}

// ── PDF Generation ──

export async function exportCharacterAsCardPdf(char: ExportCharacter): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // Load fonts
  const [regularBytes, boldBytes] = await Promise.all([
    fetch(BASE + 'fonts/Inter-Regular.ttf').then((r) => r.arrayBuffer()),
    fetch(BASE + 'fonts/Inter-Bold.ttf').then((r) => r.arrayBuffer()),
  ])
  const fontRegular = await pdfDoc.embedFont(regularBytes)
  const fontBold = await pdfDoc.embedFont(boldBytes)

  // Determine which back card to use
  const isToC = !!char.backstory.drive
  const frontLayout = CARD_LAYOUTS.find((l) => l.id === 'front')!
  const backLayout = CARD_LAYOUTS.find((l) => l.id === (isToC ? 'back_toc' : 'back_classic'))!

  // Load card images
  const [frontImgBytes, backImgBytes] = await Promise.all([
    fetch(BASE + frontLayout.image.replace(/^\//, '')).then((r) => r.arrayBuffer()),
    fetch(BASE + backLayout.image.replace(/^\//, '')).then((r) => r.arrayBuffer()),
  ])
  const frontImg = await pdfDoc.embedPng(frontImgBytes)
  const backImg = await pdfDoc.embedPng(backImgBytes)

  // Page size: A4
  const PW = 595
  const PH = 842

  // PDF font sizes — layout fontSizes are design hints, we override for PDF
  // Map layout fontSize → actual PDF pt size
  const PDF_FONT_SIZE: Record<number, number> = {
    7: 5.5,    // skills, equip, weapons, specs
    8: 6,    // photo placeholder
    9: 7,    // backstory text, residence, spending
    10: 8,   // basic info (player, occupation, age, gender)
    11: 9,   // name
    12: 9,   // derived (san, hp, luck, mp)
    13: 11,   // characteristics main values
  }

  // Merged skill points
  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [k, v] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[k] = (allSkillPoints[k] ?? 0) + v
  }

  // Spec names mapping
  const specNames = matchSpecializations(char)

  // ── Render a page ──
  function renderPage(
    page: PDFPage,
    img: PDFImage,
    fields: FieldBox[],
    skillGrids?: SkillColumnGrid[],
  ) {
    // Draw card image as background
    page.drawImage(img, { x: 0, y: 0, width: PW, height: PH })

    const INK = rgb(0.05, 0.05, 0.05)

    // Render regular fields
    for (const f of fields) {
      // Get value — check spec names first, then regular mapping
      let value = specNames[f.id] ?? getFieldValue(f.id, char)
      if (!value) continue

      const font = f.bold ? fontBold : fontRegular
      const fontSize = PDF_FONT_SIZE[f.fontSize ?? 9] ?? (f.fontSize ?? 9) * 0.85
      const fieldX = (f.x / 100) * PW
      const fieldY = PH - (f.y / 100) * PH
      const fieldW = (f.w / 100) * PW
      const fieldH = (f.h / 100) * PH

      if (f.maxLines && f.maxLines > 1) {
        // Multi-line text wrapping
        renderWrappedText(page, value, fieldX, fieldY, fieldW, fieldH, font, fontSize, INK, f.align)
      } else {
        // Single line
        let textX = fieldX
        const textWidth = font.widthOfTextAtSize(value, fontSize)
        if (f.align === 'center') textX = fieldX + (fieldW - textWidth) / 2
        else if (f.align === 'right') textX = fieldX + fieldW - textWidth

        page.drawText(value, {
          x: textX,
          y: fieldY - fontSize,
          size: fontSize,
          font,
          color: INK,
        })
      }
    }

    // Render skill grids
    if (skillGrids) {
      for (const grid of skillGrids) {
        const gridX = (grid.x / 100) * PW
        const gridY = PH - (grid.y / 100) * PH
        const gridW = (grid.w / 100) * PW
        const gridH = (grid.h / 100) * PH
        const rowH = gridH / grid.rows.length
        const fontSize = 5.5

        for (let ri = 0; ri < grid.rows.length; ri++) {
          const row = grid.rows[ri]
          const rowY = gridY - ri * rowH

          // Find skill value
          let totalValue = 0
          let hasPoints = false

          if (row.type === 'fixed') {
            const points = allSkillPoints[row.skillId] ?? 0
            if (points > 0) {
              const base = resolveBase(row.skillId, char.characteristics)
              totalValue = base + points
              hasPoints = true
            }
          } else if (row.type === 'open_spec' || row.type === 'open_combat') {
            // Find matching specialization in character data
            const parent = row.parentSkill ?? getBaseSkillId(row.skillId)
            const fixedSpecs = new Set(['bron_palna:karabin_strzelba', 'bron_palna:krotka', 'walka_wrecz:bijatyka'])
            const charSpecs = Object.keys(allSkillPoints)
              .filter((k) => getBaseSkillId(k) === parent && !fixedSpecs.has(k) && allSkillPoints[k] > 0)

            // Get the open slot index (e.g., _open1 → 0)
            const slotIdx = parseInt(row.skillId.match(/_open(\d)$/)?.[1] ?? '0') - 1
            if (slotIdx >= 0 && slotIdx < charSpecs.length) {
              const specKey = charSpecs[slotIdx]
              const base = resolveBase(specKey, char.characteristics)
              totalValue = base + allSkillPoints[specKey]
              hasPoints = true
            }
          }

          if (!hasPoints || totalValue === 0) continue

          const half = halfValue(totalValue)
          const fifth = fifthValue(totalValue)

          // Render value in sub-columns
          const renderCell = (offsetPct: number, text: string) => {
            const cellX = gridX + (offsetPct / 100) * gridW
            const cellW = (grid.cellW / 100) * gridW
            const tw = fontRegular.widthOfTextAtSize(text, fontSize)
            page.drawText(text, {
              x: cellX + (cellW - tw) / 2,
              y: rowY - fontSize - (rowH - fontSize) / 2,
              size: fontSize,
              font: fontRegular,
              color: INK,
            })
          }

          renderCell(grid.valueX, String(totalValue))
          if (half > 0) renderCell(grid.halfX, String(half))
          if (fifth > 0) renderCell(grid.fifthX, String(fifth))
        }
      }
    }
  }

  // ── Multi-line text wrapping ──
  function renderWrappedText(
    page: PDFPage, text: string,
    x: number, y: number, w: number, h: number,
    font: PDFFont, fontSize: number, color: ReturnType<typeof rgb>,
    align?: string,
  ) {
    const lineHeight = fontSize * 1.3
    const lines: string[] = []
    const paragraphs = text.split('\n')

    for (const para of paragraphs) {
      const words = para.split(/\s+/)
      let currentLine = ''
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word
        if (font.widthOfTextAtSize(test, fontSize) > w && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = test
        }
      }
      if (currentLine) lines.push(currentLine)
    }

    const maxLines = Math.floor(h / lineHeight)
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      let textX = x
      if (align === 'center') textX = x + (w - font.widthOfTextAtSize(lines[i], fontSize)) / 2
      else if (align === 'right') textX = x + w - font.widthOfTextAtSize(lines[i], fontSize)

      page.drawText(lines[i], {
        x: textX,
        y: y - (i + 1) * lineHeight,
        size: fontSize,
        font,
        color,
      })
    }
  }

  // ── Build pages ──
  const frontPage = pdfDoc.addPage([PW, PH])
  renderPage(frontPage, frontImg, frontLayout.fields, FRONT_SKILL_GRIDS)

  const backPage = pdfDoc.addPage([PW, PH])
  renderPage(backPage, backImg, backLayout.fields)

  return pdfDoc.save()
}
