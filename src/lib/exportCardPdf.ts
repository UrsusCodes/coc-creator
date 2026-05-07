import { PDFDocument, PDFImage, PDFEmbeddedPage, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { CARD_LAYOUTS, type FieldBox, type SkillColumnGrid } from '@/data/cardFieldLayouts'
import type { SkillRowV2, SpecRowV2, BoxV2 } from '@/data/cardFrontV2.types'
import { OCCUPATIONS } from '@/data/occupations'
import { getSkillBase, getSkillDisplayName, getBaseSkillId, getSpecialization } from '@/data/skills'
import { WEAPONS } from '@/data/weapons'
import { WEAPONS_CATALOG_V2 } from '@/data/weaponsV2'
import { BLACK_MARKET_CATALOG } from '@/data/blackMarket'
import { DRIVES } from '@/data/drivePillars'
import { halfValue, fifthValue } from '@/lib/utils'
import type { CharacteristicKey } from '@/types/common'
import type { CharacterPosition, CharacterContact, MainPosition, AdditionalPosition, ContactV2 } from '@/types/character'

const BASE = import.meta.env.BASE_URL ?? '/'

interface ExportCharacter {
  name: string
  age: number
  gender: string
  appearance: string
  residence?: string
  birthplace?: string
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
  positions?: CharacterPosition[]
  contacts?: CharacterContact[]
  main_position?: MainPosition | null
  additional_positions?: AdditionalPosition[]
  contacts_v2?: ContactV2[]
  /** Legacy avatar URL (pre-migration 021). Used as fallback if card_portrait_url unset. */
  portrait_url?: string
  /** PDF-card portrait set via the workshop editor (cropped + filtered). Migration 021. */
  card_portrait_url?: string
}

type Derived = { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }

// Fields that should render bold text before the colon
const BOLD_BEFORE_COLON_FIELDS = new Set(['drive', 'sources'])

// ── Helpers ──

// Ręcznie skrócone nazwy pozycji na kartę PDF (max ~20 znaków)
const POSITION_SHORT_NAMES: Record<string, string> = {
  // Policja / służby
  sp_posterunek:    'Posterunek policji',
  sp_wydzial:       'Wydz. śledczy',
  sp_federalna:     'Agencja federalna',
  sp_tajna:         'Tajna służba',
  sp_urzad:         'Urząd miejski',
  sp_antykorupcja:  'Antykorupcja',
  sp_niezalezny:    'Śledczy rządowy',
  // Detektyw
  dw_wlasna:        'Własna agencja det.',
  dw_lokalna:       'Agencja det. lok.',
  dw_pinkerton:     'Agencja Pinkerton',
  dw_wolny:         'Wolny strzelec',
  dw_wywiad:        'Wywiad wojsk./rząd.',
  dw_ubezpieczenia: 'Agencja ubezp.',
  dw_zagraniczna:   'Sieć wywiad. zagr.',
  // Przestępczość
  pz_grupka:        'Grupka przestępców',
  pz_lokalny:       'Gang uliczny lok.',
  pz_istotny:       'Gang miejski',
  pz_wielostanowy:  'Org. wielostanowa',
  pz_przemyt:       'Przemyt alkoholu',
  pz_import:        'Przemyt (import)',
  pz_syndykat:      'Syndykat między.',
  pz_wlasna:        'Własna operacja',
  // Hazard
  pd_samodzielny:   'Hazardzista niezal.',
  pd_banda:         'Mała banda',
  pd_dom_gry:       'Dom gry / kasyno',
  pd_paserstwo:     'Sieć paserska',
  pd_falsz:         'Warsztat fałszerski',
  pd_dokumenty:     'Fałszerstwo dok.',
  // Nauka
  an_wydzial:       'Wydział univ.',
  an_college:       'Mały college',
  an_instytut:      'Instytut badawczy',
  an_laboratorium:  'Własne lab. nauk.',
  an_biblioteka:    'Biblioteka publ.',
  an_muzeum:        'Muzeum (nauka)',
  an_towarzystwo:   'Tow. naukowe',
  an_wyprawa:       'Wyprawa badawcza',
  an_pismo:         'Pismo naukowe',
  an_paranormal:    'Gabinet parapsych.',
  an_fundacja:      'Fundacja badawcza',
  // Okultyzm
  ok_samotnik:      'Niezal. okultysta',
  ok_krag:          'Krąg okultystyczny',
  ok_lodza:         'Loża ezoteryczna',
  ok_kult_lok:      'Kult (lok. komórka)',
  ok_teozofia:      'Tow. teozoficzne',
  ok_siec:          'Sieć kultów',
  ok_antykwariat:   'Antykwariat (ezot.)',
  ok_bractwo:       'Tajne bractwo',
  ok_stary_bog:     'Kult starego boga',
  // Medycyna
  mw_szpital_miejski:   'Szpital miejski',
  mw_szpital_prywatny:  'Szpital prywatny',
  mw_praktyka:          'Prywatna praktyka',
  mw_sanatorium:        'Sanatorium pryw.',
  mw_psychiatryczny:    'Szpital psych.',
  mw_gabinet_psych:     'Gabinet psychoanal.',
  mw_sadowa:            'Lab. med. sądowej',
  mw_uczelnia:          'Wydz. medyczny',
  mw_tajny:             'Tajny ośrodek',
  // Farmacja
  mn_apteka_wlasna:  'Apteka (własna)',
  mn_apteka_prac:    'Apteka (pracownik)',
  mn_szpital:        'Szpital miejski',
  mn_psychiatryczny: 'Szpital psych.',
  mn_nielegalny:     'Nielegalna farmacja',
  // Dziennikarstwo
  dm_lokalna:       'Mała gazeta lok.',
  dm_duza:          'Duża gazeta',
  dm_magazyn:       'Magazyn tygodniowy',
  dm_agencja:       'Agencja prasowa',
  dm_wolny:         'Wolny dziennikarz',
  dm_zagraniczny:   'Redakcja zagr.',
  dm_naukowe:       'Pismo nauk./branż.',
  dm_okultystyczne: 'Pismo okultyst.',
  dm_radio:         'Radio',
  // Sztuka
  ls_wolny:         'Wolny twórca',
  ls_teatr:         'Teatr repertuarowy',
  ls_hollywood:     'Studio filmowe',
  ls_wydawnictwo:   'Dom wydawniczy',
  ls_jazz:          'Klub jazzowy/kab.',
  ls_galeria:       'Galeria sztuki',
  ls_cyrk:          'Cyrk / trupa wędr.',
  ls_okultystyczna: 'Twórczość okultyst.',
  // Prawo
  pr_wlasna:        'Własna kancelaria',
  pr_partnerska:    'Kancelaria partner.',
  pr_korporacyjna:  'Kancelaria korpor.',
  pr_prokurator:    'Prokurator okr.',
  pr_sedzia:        'Sąd okr. (sędzia)',
  pr_federalny:     'Sąd federalny',
  pr_kryminalna:    'Obrona kryminalna',
  pr_syndykat:      'Radca kryminalny',
  // Bogaty hobbysta
  bk_prywatna:      'Pryw. kolekcja',
  bk_sklep:         'Sklep antykwaryczny',
  bk_dom_aukcyjny:  'Dom aukcyjny',
  bk_muzeum:        'Muzeum (kurator)',
  bk_klub:          'Klub dżentelmenów',
  bk_podroznicze:   'Tow. podróżnicze',
  bk_fundator:      'Fundator ekspedycji',
  bk_okultystyczna: 'Kolekcja artefaktów',
  // Duchowny (uwaga: dm_ prefix — inne niż dziennikarstwo!)
  dm_parafia:        'Parafia lokalna',
  dm_katedra:        'Kościół katedralny',
  dm_misja_miejska:  'Misja miejska',
  dm_misja_zagr:     'Misja zagraniczna',
  dm_niezalezny_k:   'Kościół niezal.',
  dm_spirytystyczna: 'Kongregacja spiryt.',
  // Wojsko
  wo_aktywna:        'Armia USA (aktywna)',
  wo_rezerwa:        'Rezerwa wojsk.',
  wo_sztab:          'Sztab generalny',
  wo_specjalna:      'Wywiad wojskowy',
  wo_weteran:        'Weteran bez afil.',
  wo_stowarzyszenie: 'Stow. weteranów',
  wo_ochrona:        'Firma ochroniarska',
  // Inżynieria
  it_wlasne:        'Własne biuro proj.',
  it_firma:         'Firma inżynierska',
  it_budowlana:     'Firma budowlana',
  it_laboratorium:  'Lab. wynalazcze',
  // Handel
  bh_wlasny:    'Własny sklep/zakład',
  bh_import:    'Firma import/eksport',
  bh_korporacja:'Korporacja',
  bh_wolny:     'Wolny agent hand.',
  // Służba
  so_prywatna:  'Służba prywatna',
  so_hotel:     'Hotel / restauracja',
  so_speakeasy: 'Speakeasy',
  so_szofer:    'Prywatny szofer',
  // Robotnik
  op_zwiazek_lok:    'Związek zaw. lok.',
  op_zwiazek_central:'Centralny zw. zaw.',
  op_straz:          'Straż pożarna',
  // Farmer
  pf_wlasna:     'Własna farma',
  pf_traper:     'Traper / myśliwy',
  pf_robotnik:   'Wędr. robotnik',
  pf_ekspedycja: 'Ekspedycja eksp.',
  // Sport / rozrywka
  rs_cyrk:          'Cyrk objazdowy',
  rs_kaskader:      'Trupa kaskaderska',
  rs_studio:        'Studio filmowe',
  rs_klub_bokserski:'Klub bokserski',
  rs_liga:          'Liga profesjonalna',
  rs_pilot:         'Pilot prywatny',
  rs_zoo:           'Ogród zoologiczny',
  // Margines
  ms_bez_afilacji: 'Bez afiliacji',
  ms_dom_pub:      'Dom publiczny',
  ms_siec_trampa:  'Sieć trampa',
  // Różne
  zn_wlasna_firma: 'Własna firma',
  zn_statek:       'Statek handlowy',
  zn_mysliwy:      'Myśliwy / przew.',
  zn_uczelnia:     'Uczelnia (stażysta)',
  zn_warsztat:     'Warsztat mech.',
}

function positionPdfName(optionId: string, optionName: string): string {
  return POSITION_SHORT_NAMES[optionId] ?? optionName
}

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
  if (id === 'age') return `${char.age} lat`
  if (id === 'gender') return char.gender === 'M' ? 'Mężczyzna' : char.gender === 'F' ? 'Kobieta' : char.gender
  if (id === 'residence') return char.residence ?? ''
  if (id === 'birthplace') return char.birthplace ?? ''
  if (id === 'photo' || id === 'death_place') return ''

  // Characteristics
  if (id === 'char_move') return String(derived.move_rate)
  if (id === 'walk_speed_hex') return String(Math.floor(derived.move_rate / 3))
  if (id === 'sprint_speed_hex') return String(Math.floor((derived.move_rate * 5) / 3))
  const charBase = id.replace(/_half$/, '').replace(/_fifth$/, '')
  const charKey = CHAR_KEY_MAP[charBase]
  if (charKey) {
    const val = char.characteristics[charKey] ?? 0
    if (val === 0) return ''
    if (id.endsWith('_half')) return String(halfValue(val))
    if (id.endsWith('_fifth')) return String(fifthValue(val))
    return String(val)
  }

  // Derived (legacy + v2 dot-notation. `*.curr` is intentionally blank — the
  // player fills it in by hand at the table.)
  if (id === 'san' || id === 'san.max') return String(derived.san)
  if (id === 'san.fifth') return String(Math.floor(derived.san / 5))
  if (id === 'san.curr') return ''
  if (id === 'hp' || id === 'hp.max') return String(derived.hp)
  if (id === 'hp.curr') return ''
  if (id === 'mp' || id === 'mp.max') return String(derived.mp)
  if (id === 'mp.curr') return ''
  if (id === 'luck' || id === 'luck.max') return String(char.luck)
  if (id === 'luck.curr') return ''
  if (id === 'walk') return String(Math.floor(derived.move_rate / 3))
  if (id === 'sprint') return String(Math.floor((derived.move_rate * 5) / 3))
  if (id === 'damage_bonus') return String(derived.db)
  if (id === 'build') return String(derived.build)
  if (id === 'dodge') {
    const unikPoints = (char.occupation_skill_points['unik'] ?? 0) + (char.personal_skill_points['unik'] ?? 0)
    return String(derived.dodge + unikPoints)
  }
  if (id === 'spending_level') {
    const v = char.spending_level ?? ''
    return v.startsWith('$') ? v.slice(1) + '$' : v
  }
  if (id === 'cash') {
    if (!char.cash) return ''
    const match = char.cash.match(/Gotówka:\s*(.+?)(?:\s*\||$)/)
    const raw = (match ? match[1].trim() : char.cash).replace(/\s/g, '')
    return raw.startsWith('$') ? raw.slice(1) + '$' : raw
  }

  // Weapon fields
  if (id.startsWith('weap')) return ''

  // Spec name fields
  if (id.startsWith('spec_')) return ''

  // Back card: classic backstory
  if (id === 'appearance_description') return String(char.backstory.appearance_description ?? '')
  if (id === 'ideology') return String(char.backstory.ideology ?? '')
  if (id === 'significant_people') {
    const who = char.backstory.significant_people_who ?? ''
    const why = char.backstory.significant_people_why ?? ''
    return [who, why].filter(Boolean).join('\n')
  }
  if (id === 'meaningful_locations') return String(char.backstory.meaningful_locations ?? '')
  if (id === 'traits') return String(char.backstory.traits ?? '')

  // Back card: ToC
  if (id === 'drive') {
    const driveId = char.backstory.drive as string | undefined
    const detail = char.backstory.drive_detail as string | undefined
    if (!driveId) return ''
    const driveObj = DRIVES.find((d) => d.id === driveId)
    const name = driveObj?.name ?? driveId
    return detail ? `${name}: ${detail}` : `${name}: ${driveObj?.description ?? ''}`
  }
  if (id === 'pillars') {
    const p = char.backstory.pillars as string[] | undefined
    return p ? p.filter(Boolean).join('\n') : ''
  }
  if (id === 'sources') {
    const catLabels: Record<string, string> = { person: 'Osoba', place: 'Miejsce', organization: 'Organizacja' }
    const s = char.backstory.sources as { name: string; category: string; description: string }[] | undefined
    return s ? s.map((src) => `${src.name}, ${catLabels[src.category] ?? src.category}: ${src.description || ''}`).join('\n') : ''
  }
  if (id === 'other_traits') return String(char.backstory.other_traits ?? '')

  // Main position
  if (id === 'position_main') {
    if (char.main_position) {
      const mp = char.main_position
      return `${mp.option_name} [${mp.organization_size}] ${mp.strength_percent}%`
    }
    return ''
  }

  // Positions (v2 first, fallback to v1)
  if (id.startsWith('position_')) {
    const idx = parseInt(id.split('_').pop()!) - 1
    if (char.additional_positions && char.additional_positions[idx] && char.additional_positions[idx].option_name) {
      const p = char.additional_positions[idx]
      return `${'★'.repeat(p.weight)} ${p.option_name} [${p.roll_value}%]${p.pending_st_approval ? ' [ST]' : ''}`
    }
    if (char.positions && char.positions[idx]) {
      const p = char.positions[idx]
      return `${p.weightDisplay} ${p.description} [${p.rollValue}%]${p.pendingSt ? ' [ST]' : ''}`
    }
    return ''
  }

  // Contacts (v2 first, fallback to v1)
  if (id.startsWith('contact_')) {
    const idx = parseInt(id.split('_').pop()!) - 1
    if (char.contacts_v2 && char.contacts_v2[idx]) {
      const c = char.contacts_v2[idx]
      const name = c.subcategory_name || ''
      if (!name) return ''
      const d = Math.max(1, Math.min(3, c.strength))
      return `${'◆'.repeat(d)}${'░'.repeat(3 - d)} ${name} [${c.roll_value}%]${c.synergy_bonus > 0 ? ' ✨' : ''}${c.pending_st_approval ? ' [ST]' : ''}`
    }
    if (char.contacts && char.contacts[idx]) {
      const c = char.contacts[idx]
      return `${c.strengthDisplay} ${c.subcategory} [${c.rollValue}%]${c.synergyBonus > 0 ? ' ✨' : ''}${c.pendingSt ? ' [ST]' : ''}`
    }
    return ''
  }

  // Bottom section
  if (id.startsWith('equip_') || id.startsWith('asset_')) return ''

  return ''
}

// ── Parse equipment[] into categorized slots ──

interface ParsedEquipment {
  weapons: { name: string; skill: string; half: string; fifth: string; dmg: string; range: string; attacks: string; ammo: string; malf: string }[]
  equipLeft: string[]
  equipRight: string[]
  assets: string[]
  positions: string[]
}

function buildWeaponEntry(
  name: string, skillId: string, damage: string, range: string,
  attacksPerRound: string, ammo: number | null | undefined, malfunction: number | undefined,
  chars: Record<string, number>, allSkillPoints: Record<string, number>,
): ParsedEquipment['weapons'][0] {
  const skillBase = resolveBase(skillId, chars)
  const skillPoints = allSkillPoints[skillId] ?? 0
  const total = skillBase + skillPoints
  return {
    name,
    skill: total > 0 ? String(total) : '',
    half: total > 0 ? String(halfValue(total)) : '',
    fifth: total > 0 ? String(fifthValue(total)) : '',
    dmg: damage,
    range,
    attacks: attacksPerRound,
    ammo: ammo ? String(ammo) : '—',
    malf: malfunction ? String(malfunction) : '—',
  }
}

function parseEquipment(char: ExportCharacter): Record<string, string> {
  const result: Record<string, string> = {}
  const equip: string[] = []
  const assets: string[] = []
  const lifestyleV2: string[] = []
  const lifestyleV1: string[] = []
  const weapons: ParsedEquipment['weapons'] = []

  // Merge skill points for weapon skill lookup
  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [k, v] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[k] = (allSkillPoints[k] ?? 0) + v
  }

  for (const item of char.equipment) {
    const stripped = item.replace(/^\[.*?\]\s*/, '')

    // v2 tags
    if (item.startsWith('[Lokum]')) { assets.push(stripped); continue }
    if (item.startsWith('[Transport]')) { assets.push(stripped); continue }
    if (item.startsWith('[Lifestyle]')) { lifestyleV2.push(`Styl życia: ${stripped}`); continue }
    if (item.startsWith('[Dobytek]')) { assets.push(stripped); continue }

    // Legacy tags (v1 compat)
    if (item.startsWith('[Mieszkanie]')) { assets.push(stripped); continue }
    if (item.startsWith('[Styl życia]')) { lifestyleV1.push(`Styl życia: ${stripped}`); continue }

    // Tagged weapons (including black market and military)
    if (item.startsWith('[Broń]') || item.startsWith('[Czarny rynek]') || item.startsWith('[Wojsko]')) {
      // 1. Try old WEAPONS catalog
      const weapon = WEAPONS.find((w) => item.includes(w.name))
      if (weapon) {
        weapons.push(buildWeaponEntry(
          weapon.name, weapon.skill_id, weapon.damage, weapon.range,
          weapon.attacks_per_round, weapon.ammo, weapon.malfunction,
          char.characteristics, allSkillPoints,
        ))
        continue
      }

      // 2. Try WEAPONS_CATALOG_V2
      const weaponV2 = WEAPONS_CATALOG_V2.find((w) => item.includes(w.name))
      if (weaponV2) {
        weapons.push(buildWeaponEntry(
          weaponV2.name, weaponV2.skillId, weaponV2.damage, weaponV2.range,
          '1', weaponV2.ammo, weaponV2.malfunction,
          char.characteristics, allSkillPoints,
        ))
        continue
      }

      // 3. Try BLACK_MARKET_CATALOG (weapons with skillId)
      const bmItem = BLACK_MARKET_CATALOG.find((bm) => bm.skillId && item.includes(bm.name))
      if (bmItem && bmItem.skillId) {
        weapons.push(buildWeaponEntry(
          bmItem.name, bmItem.skillId, bmItem.damage ?? '', bmItem.range ?? '',
          '1', bmItem.ammo, bmItem.malfunction,
          char.characteristics, allSkillPoints,
        ))
        continue
      }

      // 4. Fallback: parse from tag format "[Broń] Name (damage, range)"
      const match = stripped.match(/^(.+?)\s*\(([^,]+),\s*(.+?)\)/)
      if (match) {
        weapons.push({
          name: match[1], skill: '', half: '', fifth: '',
          dmg: match[2], range: match[3],
          attacks: '1', ammo: '—', malf: '—',
        })
      } else {
        equip.push(stripped)
      }
      continue
    }

    // Tagged equipment
    if (item.startsWith('[Ekwipunek]')) { equip.push(stripped); continue }

    // Untagged: try weapon match (legacy), otherwise equipment
    const weapon = WEAPONS.find((w) => item.includes(w.name))
    if (weapon) {
      weapons.push(buildWeaponEntry(
        weapon.name, weapon.skill_id, weapon.damage, weapon.range,
        weapon.attacks_per_round, weapon.ammo, weapon.malfunction,
        char.characteristics, allSkillPoints,
      ))
    } else {
      equip.push(item)
    }
  }

  // Fill weapon fields (up to 5). Legacy IDs (skill/half/fifth/dmg/malf) and
  // v2 IDs (norm/hard/extreme/damage/reliability) populate the same values
  // — the v2 layout uses the v2 names.
  for (let i = 0; i < Math.min(weapons.length, 5); i++) {
    const w = weapons[i]
    const n = i + 1
    result[`weap${n}_name`] = w.name
    result[`weap${n}_skill`] = w.skill
    result[`weap${n}_norm`] = w.skill
    result[`weap${n}_half`] = w.half
    result[`weap${n}_hard`] = w.half
    result[`weap${n}_fifth`] = w.fifth
    result[`weap${n}_extreme`] = w.fifth
    result[`weap${n}_dmg`] = w.dmg
    result[`weap${n}_damage`] = w.dmg
    result[`weap${n}_range`] = w.range
    result[`weap${n}_attacks`] = w.attacks
    result[`weap${n}_ammo`] = w.ammo
    result[`weap${n}_malf`] = w.malf
    result[`weap${n}_reliability`] = w.malf
  }

  // Group duplicate equipment items: ["Ammo", "Ammo", "Ammo"] → ["Ammo [x3]"]
  const groupedEquip: string[] = []
  const equipCounts = new Map<string, number>()
  for (const item of equip) {
    // Skip items already grouped (have [xN] suffix)
    if (/\[x\d+\]$/.test(item)) { groupedEquip.push(item); continue }
    equipCounts.set(item, (equipCounts.get(item) ?? 0) + 1)
  }
  for (const [item, count] of equipCounts) {
    groupedEquip.push(count > 1 ? `${item} [x${count}]` : item)
  }

  // Fill equipment (left col 1-12, right col 1-12)
  for (let i = 0; i < Math.min(groupedEquip.length, 12); i++) {
    result[`equip_l_${i + 1}`] = groupedEquip[i]
  }
  for (let i = 12; i < Math.min(groupedEquip.length, 24); i++) {
    result[`equip_r_${i - 11}`] = groupedEquip[i]
  }

  // Fill assets (up to 12)
  for (let i = 0; i < Math.min(assets.length, 12); i++) {
    result[`asset_${i + 1}`] = assets[i]
  }

  // Fill positions (up to 6): lifestyle first, then main_position, then additional
  // Prefer v2 [Lifestyle] over legacy [Styl życia] if both exist
  const lifestyle = lifestyleV2.length > 0 ? lifestyleV2 : lifestyleV1
  const allPositions: string[] = []
  allPositions.push(...lifestyle)
  if (char.main_position?.option_name) {
    const mp = char.main_position
    allPositions.push(`${positionPdfName(mp.option_id, mp.option_name)} ${mp.strength_percent}%`)
  }
  for (const p of char.additional_positions ?? []) {
    if (p.option_name) {
      allPositions.push(`${'★'.repeat(p.weight)} ${positionPdfName(p.option_id, p.option_name)} [${p.roll_value}%]${p.pending_st_approval ? ' [ST]' : ''}`)
    }
  }
  for (let i = 0; i < Math.min(allPositions.length, 6); i++) {
    result[`position_${i + 1}`] = allPositions[i]
  }

  return result
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

  // Load fonts (EB Garamond — single font family for v2 dynamic text;
  // labels and section bars are baked into the PDF background).
  const [regularBytes, boldBytes] = await Promise.all([
    fetch(BASE + 'fonts/EBGaramond-Regular.ttf').then((r) => r.arrayBuffer()),
    fetch(BASE + 'fonts/EBGaramond-Bold.ttf').then((r) => r.arrayBuffer()),
  ])
  const fontRegular = await pdfDoc.embedFont(regularBytes)
  const fontBold = await pdfDoc.embedFont(boldBytes)

  // Determine which front + back to use
  const isToC = !!char.backstory.drive
  const frontLayout = CARD_LAYOUTS.find((l) => l.id === 'front_v2')!
  const backLayout = CARD_LAYOUTS.find((l) => l.id === (isToC ? 'back_toc' : 'back_classic'))!

  // Load backgrounds. Front is a vector PDF (v2); back is still a PNG raster.
  const [frontBgBytes, backImgBytes] = await Promise.all([
    fetch(BASE + frontLayout.image.replace(/^\//, '')).then((r) => r.arrayBuffer()),
    fetch(BASE + backLayout.image.replace(/^\//, '')).then((r) => r.arrayBuffer()),
  ])
  const [frontBgPage] = await pdfDoc.embedPdf(frontBgBytes)
  const backImg = await pdfDoc.embedPng(backImgBytes)

  // Load portrait if available — prefer the workshop-edited card variant
  // (already cropped + filtered, ready to embed), fall back to the
  // legacy portrait_url for characters that haven't been re-edited yet.
  let portraitImage: PDFImage | null = null
  const portraitSource = char.card_portrait_url || char.portrait_url
  if (portraitSource) {
    try {
      const portraitBytes = await fetch(portraitSource).then((r) => r.arrayBuffer())
      // Try JPEG first (our uploads are JPEG), fallback to PNG
      try {
        portraitImage = await pdfDoc.embedJpg(portraitBytes)
      } catch {
        portraitImage = await pdfDoc.embedPng(portraitBytes)
      }
    } catch {
      // Portrait load failed — skip silently
    }
  }

  // Page size: A4
  const PW = 595
  const PH = 842

  const PDF_FONT_SIZE: Record<number, number> = {
    7: 5.5,
    8: 6,
    9: 8,
    10: 9,
    11: 10,
    12: 10,
    13: 12,
  }

  // Merged skill points
  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [k, v] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[k] = (allSkillPoints[k] ?? 0) + v
  }

  // Spec names mapping
  const specNames = matchSpecializations(char)
  const equipData = parseEquipment(char)

  // ── Render a page ──
  interface RenderOpts {
    /** When true, treat `FieldBox.fontSize` as a literal pt value (used by
     * the v2 vector front). Otherwise the legacy `PDF_FONT_SIZE` map applies. */
    directPt?: boolean
    skillGrids?: SkillColumnGrid[]
    skillRowsV2?: SkillRowV2[]
    specRowsV2?: SpecRowV2[]
  }
  function renderPage(
    page: PDFPage,
    bg: PDFImage | PDFEmbeddedPage,
    fields: FieldBox[],
    opts: RenderOpts = {},
  ) {
    // Both PDFImage and PDFEmbeddedPage expose numeric .width/.height — use
    // instanceof to disambiguate.
    if (bg instanceof PDFImage) {
      page.drawImage(bg, { x: 0, y: 0, width: PW, height: PH })
    } else {
      page.drawPage(bg, { x: 0, y: 0, width: PW, height: PH })
    }
    const { directPt, skillGrids, skillRowsV2, specRowsV2 } = opts

    // Embed portrait if available
    if (portraitImage) {
      const photoField = fields.find((f) => f.id === 'photo')
      if (photoField) {
        const px = (photoField.x / 100) * PW
        const py = PH - (photoField.y / 100) * PH
        const pw = (photoField.w / 100) * PW
        const ph = (photoField.h / 100) * PH
        // Fit image within field, maintaining aspect ratio
        const imgAspect = portraitImage.width / portraitImage.height
        const boxAspect = pw / ph
        let drawW = pw, drawH = ph
        if (imgAspect > boxAspect) {
          drawH = pw / imgAspect
        } else {
          drawW = ph * imgAspect
        }
        const drawX = px + (pw - drawW) / 2
        const drawY = py - ph + (ph - drawH) / 2
        page.drawImage(portraitImage, { x: drawX, y: drawY, width: drawW, height: drawH })
      }
    }

    const INK = rgb(0.05, 0.05, 0.05)

    for (const f of fields) {
      const value = equipData[f.id] ?? specNames[f.id] ?? getFieldValue(f.id, char)
      if (!value) continue

      const font = f.bold ? fontBold : fontRegular
      const fontSize = directPt
        ? (f.fontSize ?? 10)
        : (PDF_FONT_SIZE[f.fontSize ?? 9] ?? (f.fontSize ?? 9) * 0.85)
      const fieldX = (f.x / 100) * PW
      const fieldY = PH - (f.y / 100) * PH
      const fieldW = (f.w / 100) * PW
      const fieldH = (f.h / 100) * PH

      const useBoldColon = BOLD_BEFORE_COLON_FIELDS.has(f.id)

      if (f.maxLines && f.maxLines > 1) {
        renderWrappedText(page, value, fieldX, fieldY, fieldW, fieldH, font, fontSize, INK, f.align, useBoldColon)
      } else {
        let textX = fieldX
        const textWidth = font.widthOfTextAtSize(value, fontSize)
        if (f.align === 'center') textX = fieldX + (fieldW - textWidth) / 2
        else if (f.align === 'right') textX = fieldX + fieldW - textWidth

        // Vertical centering: baseline = box_center - capHeight/2. The legacy
        // path keeps the historical `size/3` approximation; the v2 path uses
        // pdf-lib's font metrics for tighter accuracy.
        const textY = directPt
          ? fieldY - fieldH / 2 - font.heightAtSize(fontSize, { descender: false }) / 2
          : fieldY - fieldH / 2 - fontSize / 3

        page.drawText(value, {
          x: textX,
          y: textY,
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
            const parent = row.parentSkill ?? getBaseSkillId(row.skillId)
            const fixedSpecs = new Set(['bron_palna:karabin_strzelba', 'bron_palna:krotka', 'walka_wrecz:bijatyka'])
            const charSpecs = Object.keys(allSkillPoints)
              .filter((k) => getBaseSkillId(k) === parent && !fixedSpecs.has(k) && allSkillPoints[k] > 0)

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

          const renderCell = (offsetPct: number, text: string, bold = false) => {
            const cellFont = bold ? fontBold : fontRegular
            const cellX = gridX + (offsetPct / 100) * gridW
            const cellW = (grid.cellW / 100) * gridW
            const tw = cellFont.widthOfTextAtSize(text, fontSize)
            page.drawText(text, {
              x: cellX + (cellW - tw) / 2,
              y: rowY - fontSize - (rowH - fontSize) / 2,
              size: fontSize,
              font: cellFont,
              color: INK,
            })
          }

          renderCell(grid.valueX, String(totalValue), true)
          if (half > 0) renderCell(grid.halfX, String(half))
          if (fifth > 0) renderCell(grid.fifthX, String(fifth))
        }
      }
    }

    // ── v2: per-row skill coords (regular skills, 3-col grid).
    // Render base+points for every skill (not just trained). Empty boxes
    // on the printed card looked unfinished — players want all values
    // visible at print time, then update by hand during play.
    if (skillRowsV2) {
      for (const row of skillRowsV2) {
        const points = allSkillPoints[row.skillKey] ?? 0
        const base = resolveBase(row.skillKey, char.characteristics)
        const total = base + points
        if (total === 0) continue
        if (points > 0) drawCenteredInBoxV2(page, row.cb, '✓', 6, fontBold)
        drawCenteredInBoxV2(page, row.v, String(total), 7, fontBold)
        const halfV = halfValue(total)
        const fifthV = fifthValue(total)
        if (halfV > 0) drawCenteredInBoxV2(page, row.half, String(halfV), 5.5, fontRegular)
        if (fifthV > 0) drawCenteredInBoxV2(page, row.fifth, String(fifthV), 5.5, fontRegular)
      }
    }

    // ── v2: per-row spec coords (combat + open spec slots, 2-col grid) ──
    if (specRowsV2) {
      const fixedSpecs = new Set([
        'bron_palna:krotka', 'bron_palna:karabin_strzelba', 'bron_palna:pistolet_maszynowy',
        'bron_palna:bron_ciezka', 'bron_palna:luk_kusza',
        'walka_wrecz:bijatyka', 'walka_wrecz:dluga_ostra', 'walka_wrecz:bron_obuchowa', 'walka_wrecz:skrytobojstwo',
      ])
      for (const row of specRowsV2) {
        let resolvedKey: string | null = null
        if (row.slotKind === 'fixed') {
          // Always render fixed-slot specs (firearms, walka_wrecz) so the
          // base value is visible even when the player put no points there.
          resolvedKey = row.skillId
        } else if (row.slotKind === 'open_spec') {
          const parent = row.parent!
          const charSpecs = Object.keys(allSkillPoints)
            .filter((k) => getBaseSkillId(k) === parent && !fixedSpecs.has(k) && allSkillPoints[k] > 0)
          const slotIdx = parseInt(row.skillId.match(/_open(\d)$/)?.[1] ?? '0') - 1
          if (slotIdx >= 0 && slotIdx < charSpecs.length) resolvedKey = charSpecs[slotIdx]
        }
        if (!resolvedKey) continue
        const total = resolveBase(resolvedKey, char.characteristics) + (allSkillPoints[resolvedKey] ?? 0)
        if (total === 0) continue
        if ((allSkillPoints[resolvedKey] ?? 0) > 0) drawCenteredInBoxV2(page, row.cb, '✓', 6, fontBold)
        drawCenteredInBoxV2(page, row.v, String(total), 7, fontBold)
        const halfV = halfValue(total)
        const fifthV = fifthValue(total)
        if (halfV > 0) drawCenteredInBoxV2(page, row.half, String(halfV), 5.5, fontRegular)
        if (fifthV > 0) drawCenteredInBoxV2(page, row.fifth, String(fifthV), 5.5, fontRegular)
        // For open_spec, render the player's chosen spec name in the name slot.
        if (row.slotKind === 'open_spec' && row.name) {
          const specName = (getSpecialization(resolvedKey) ?? '').trim()
          if (specName) drawTextInBoxV2(page, row.name, specName, 7, fontRegular, 'left')
        }
      }
    }
  }

  // Helpers for v2 row rendering.
  function drawCenteredInBoxV2(page: PDFPage, box: BoxV2, text: string, size: number, font: PDFFont) {
    const x = (box.x / 100) * PW
    const y = PH - (box.y / 100) * PH
    const w = (box.w / 100) * PW
    const h = (box.h / 100) * PH
    const tw = font.widthOfTextAtSize(text, size)
    const capHalf = font.heightAtSize(size, { descender: false }) / 2
    page.drawText(text, {
      x: x + (w - tw) / 2,
      y: y - h / 2 - capHalf,
      size, font, color: rgb(0.05, 0.05, 0.05),
    })
  }
  function drawTextInBoxV2(page: PDFPage, box: BoxV2, text: string, size: number, font: PDFFont, align: 'left' | 'center' = 'left') {
    const x = (box.x / 100) * PW
    const y = PH - (box.y / 100) * PH
    const w = (box.w / 100) * PW
    const h = (box.h / 100) * PH
    let tx = x
    if (align === 'center') {
      const tw = font.widthOfTextAtSize(text, size)
      tx = x + (w - tw) / 2
    }
    const capHalf = font.heightAtSize(size, { descender: false }) / 2
    page.drawText(text, {
      x: tx,
      y: y - h / 2 - capHalf,
      size, font, color: rgb(0.05, 0.05, 0.05),
    })
  }

  // ── Word-wrap helper ──
  function wrapText(text: string, w: number, font: PDFFont, size: number): string[] {
    const lines: string[] = []
    for (const para of text.split('\n')) {
      const words = para.split(/\s+/)
      let currentLine = ''
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word
        if (font.widthOfTextAtSize(test, size) > w && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = test
        }
      }
      if (currentLine) lines.push(currentLine)
    }
    return lines
  }

  // ── Multi-line text wrapping with auto-shrink and bold-before-colon ──
  function renderWrappedText(
    page: PDFPage, text: string,
    x: number, y: number, w: number, h: number,
    font: PDFFont, fontSize: number, color: ReturnType<typeof rgb>,
    align?: string, boldBeforeColon?: boolean,
  ) {
    const MIN_FONT_SIZE = 7

    // Auto-shrink: try decreasing font size until text fits or minimum reached
    let currentSize = fontSize
    let lines = wrapText(text, w, font, currentSize)
    let lineHeight = currentSize * 1.3
    let maxLines = Math.floor(h / lineHeight)

    while (lines.length > maxLines && currentSize > MIN_FONT_SIZE) {
      currentSize -= 0.5
      lines = wrapText(text, w, font, currentSize)
      lineHeight = currentSize * 1.3
      maxLines = Math.floor(h / lineHeight)
    }

    // Truncate with "..." if still doesn't fit at minimum size
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
      const lastLine = lines[maxLines - 1]
      if (lastLine && lastLine.length > 3) {
        lines[maxLines - 1] = lastLine.slice(0, -3) + '...'
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const lineY = y - (i + 1) * lineHeight
      let textX = x
      if (align === 'center') textX = x + (w - font.widthOfTextAtSize(lines[i], currentSize)) / 2
      else if (align === 'right') textX = x + w - font.widthOfTextAtSize(lines[i], currentSize)

      if (boldBeforeColon && lines[i].includes(':')) {
        const colonIdx = lines[i].indexOf(':')
        const beforeColon = lines[i].substring(0, colonIdx + 1)
        const afterColon = lines[i].substring(colonIdx + 1)

        page.drawText(beforeColon, {
          x: textX, y: lineY, size: currentSize, font: fontBold, color,
        })
        if (afterColon.trim()) {
          const boldWidth = fontBold.widthOfTextAtSize(beforeColon, currentSize)
          page.drawText(afterColon, {
            x: textX + boldWidth, y: lineY, size: currentSize, font: fontRegular, color,
          })
        }
      } else {
        page.drawText(lines[i], {
          x: textX, y: lineY, size: currentSize, font, color,
        })
      }
    }
  }

  // ── Build pages ──
  const frontPage = pdfDoc.addPage([PW, PH])
  renderPage(frontPage, frontBgPage, frontLayout.fields, {
    directPt: true,
    skillRowsV2: frontLayout.skillRowsV2,
    specRowsV2: frontLayout.specRowsV2,
  })

  const backPage = pdfDoc.addPage([PW, PH])
  renderPage(backPage, backImg, backLayout.fields)

  return pdfDoc.save()
}
