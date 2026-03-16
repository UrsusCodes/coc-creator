/**
 * Card field layout definitions.
 * Coordinates are in percentage (0-100) of the card image dimensions (2479x3508).
 */

export interface FieldBox {
  id: string
  label: string
  x: number       // % from left
  y: number       // % from top
  w: number       // % width
  h: number       // % height
  fontSize?: number // pt for PDF rendering
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  maxLines?: number
}

export interface SkillRow {
  skillId: string
  type: 'fixed' | 'open_spec' | 'open_combat' | 'custom'
  parentSkill?: string
}

export interface SkillColumnGrid {
  id: string
  label: string
  x: number; y: number; w: number; h: number
  // Sub-column offsets (% of column width) for value boxes
  valueX: number
  halfX: number
  fifthX: number
  cellW: number
  rows: SkillRow[]
}

export interface CardLayout {
  id: string
  name: string
  image: string
  fields: FieldBox[]
  skillGrids?: SkillColumnGrid[]
}

// ─── FRONT CARD (2479×3508) ───────────────────────────────────

export const FRONT_FIELDS: FieldBox[] = [
  // ── Zdjęcie ──
  { id: 'photo', label: 'Zdjęcie', x: 3.5, y: 2.5, w: 8.5, h: 10, fontSize: 8, align: 'center' },

  // ── Dane Badacza ──
  { id: 'name', label: 'Imię Badacza', x: 13.5, y: 3.0, w: 28, h: 1.5, fontSize: 11, bold: true },
  { id: 'player_name', label: 'Gracz', x: 13.5, y: 4.7, w: 28, h: 1.5, fontSize: 10 },
  { id: 'occupation', label: 'Zawód', x: 13.5, y: 6.4, w: 28, h: 1.5, fontSize: 10 },
  { id: 'age', label: 'Wiek', x: 13.5, y: 8.1, w: 10, h: 1.5, fontSize: 10, align: 'center' },
  { id: 'gender', label: 'Płeć', x: 26, y: 8.1, w: 15.5, h: 1.5, fontSize: 10 },
  { id: 'residence', label: 'Miejsce zamieszkania', x: 13.5, y: 9.8, w: 28, h: 1.5, fontSize: 9 },
  { id: 'birthplace', label: 'Miejsce urodzenia', x: 13.5, y: 11.5, w: 28, h: 1.5, fontSize: 9 },
  { id: 'death_place', label: 'Miejsce śmierci', x: 13.5, y: 13.2, w: 28, h: 1.5, fontSize: 9 },

  // ── Cechy — wartości główne ── (top-right 3×3 grid)
  { id: 'char_str', label: 'SIŁ', x: 55.5, y: 2.8, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_dex', label: 'ZRĘ', x: 67, y: 2.8, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_pow', label: 'MOC', x: 81, y: 2.8, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_con', label: 'KON', x: 55.5, y: 6.0, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_app', label: 'WYG', x: 67, y: 6.0, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_edu', label: 'WYK', x: 81, y: 6.0, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_siz', label: 'BUD', x: 55.5, y: 9.2, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_int', label: 'INT', x: 67, y: 9.2, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },
  { id: 'char_move', label: 'RUCH', x: 81, y: 9.2, w: 7, h: 1.6, fontSize: 13, align: 'center', bold: true },

  // ── Cechy — połówki ──
  { id: 'char_str_half', label: 'SIŁ ½', x: 55.5, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_dex_half', label: 'ZRĘ ½', x: 67, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_pow_half', label: 'MOC ½', x: 81, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_con_half', label: 'KON ½', x: 55.5, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_app_half', label: 'WYG ½', x: 67, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_edu_half', label: 'WYK ½', x: 81, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_siz_half', label: 'BUD ½', x: 55.5, y: 10.9, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_int_half', label: 'INT ½', x: 67, y: 10.9, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },

  // ── Cechy — piątki ──
  { id: 'char_str_fifth', label: 'SIŁ ⅕', x: 59, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_dex_fifth', label: 'ZRĘ ⅕', x: 70.5, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_pow_fifth', label: 'MOC ⅕', x: 84.5, y: 4.5, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_con_fifth', label: 'KON ⅕', x: 59, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_app_fifth', label: 'WYG ⅕', x: 70.5, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_edu_fifth', label: 'WYK ⅕', x: 84.5, y: 7.7, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_siz_fifth', label: 'BUD ⅕', x: 59, y: 10.9, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_int_fifth', label: 'INT ⅕', x: 70.5, y: 10.9, w: 3.3, h: 1.2, fontSize: 9, align: 'center' },

  // ── Atrybuty pochodne ──
  { id: 'san', label: 'Poczytalność', x: 5, y: 15.0, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },
  { id: 'hp', label: 'PW', x: 27, y: 15.0, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },
  { id: 'luck', label: 'Szczęście', x: 55, y: 15.0, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },
  { id: 'mp', label: 'PM', x: 77, y: 15.0, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },

  // ── Nazwy specjalizacji (open sloty na karcie) ──
  // Kolumna 1: Broń Palna ×3, Język Obcy ×3
  { id: 'spec_bron_palna_1', label: 'Broń Palna spec.1', x: 13, y: 32.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_bron_palna_2', label: 'Broń Palna spec.2', x: 13, y: 35.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_bron_palna_3', label: 'Broń Palna spec.3', x: 13, y: 38.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_jezyk_obcy_1', label: 'Język Obcy spec.1', x: 13, y: 50.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_jezyk_obcy_2', label: 'Język Obcy spec.2', x: 13, y: 53.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_jezyk_obcy_3', label: 'Język Obcy spec.3', x: 13, y: 56.5, w: 10, h: 2.5, fontSize: 7 },
  // Kolumna 2: Nauka ×3, Pilotaż ×2
  { id: 'spec_nauka_1', label: 'Nauka spec.1', x: 44, y: 30, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_nauka_2', label: 'Nauka spec.2', x: 44, y: 33, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_nauka_3', label: 'Nauka spec.3', x: 44, y: 36, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_pilotaz_1', label: 'Pilotaż spec.1', x: 44, y: 54, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_pilotaz_2', label: 'Pilotaż spec.2', x: 44, y: 57, w: 10, h: 2.5, fontSize: 7 },
  // Kolumna 3: Szt./Rzem. ×3, Walka Wręcz ×2
  { id: 'spec_sztuka_1', label: 'Szt./Rzem. spec.1', x: 74, y: 24.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_sztuka_2', label: 'Szt./Rzem. spec.2', x: 74, y: 27.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_sztuka_3', label: 'Szt./Rzem. spec.3', x: 74, y: 30.5, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_walka_1', label: 'Walka Wr. spec.1', x: 74, y: 54, w: 10, h: 2.5, fontSize: 7 },
  { id: 'spec_walka_2', label: 'Walka Wr. spec.2', x: 74, y: 57, w: 10, h: 2.5, fontSize: 7 },

  // ── Uzbrojenie — 5 rzędów × kolumny ──
  // Nagłówki: BROŃ | NORMA | ½ | ⅕ | OBRAŻENIA | ZASIĘG | ATAKI | AMU. | KAW.
  // Broń 1
  { id: 'weap1_name', label: 'Broń 1 nazwa', x: 3.5, y: 86, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap1_skill', label: 'B1 %', x: 16, y: 86, w: 5.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_half', label: 'B1 ½', x: 22, y: 86, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_fifth', label: 'B1 ⅕', x: 27, y: 86, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_dmg', label: 'B1 obraż', x: 32, y: 86, w: 9, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_range', label: 'B1 zasięg', x: 41.5, y: 86, w: 7, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_attacks', label: 'B1 ataki', x: 49, y: 86, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_ammo', label: 'B1 amu', x: 54.5, y: 86, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_malf', label: 'B1 kaw', x: 60, y: 86, w: 5, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 2
  { id: 'weap2_name', label: 'Broń 2 nazwa', x: 3.5, y: 87.5, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap2_skill', label: 'B2 %', x: 16, y: 87.5, w: 5.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_half', label: 'B2 ½', x: 22, y: 87.5, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_fifth', label: 'B2 ⅕', x: 27, y: 87.5, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_dmg', label: 'B2 obraż', x: 32, y: 87.5, w: 9, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_range', label: 'B2 zasięg', x: 41.5, y: 87.5, w: 7, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_attacks', label: 'B2 ataki', x: 49, y: 87.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_ammo', label: 'B2 amu', x: 54.5, y: 87.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_malf', label: 'B2 kaw', x: 60, y: 87.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 3
  { id: 'weap3_name', label: 'Broń 3 nazwa', x: 3.5, y: 89, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap3_skill', label: 'B3 %', x: 16, y: 89, w: 5.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_half', label: 'B3 ½', x: 22, y: 89, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_fifth', label: 'B3 ⅕', x: 27, y: 89, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_dmg', label: 'B3 obraż', x: 32, y: 89, w: 9, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_range', label: 'B3 zasięg', x: 41.5, y: 89, w: 7, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_attacks', label: 'B3 ataki', x: 49, y: 89, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_ammo', label: 'B3 amu', x: 54.5, y: 89, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_malf', label: 'B3 kaw', x: 60, y: 89, w: 5, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 4
  { id: 'weap4_name', label: 'Broń 4 nazwa', x: 3.5, y: 90.5, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap4_skill', label: 'B4 %', x: 16, y: 90.5, w: 5.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_half', label: 'B4 ½', x: 22, y: 90.5, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_fifth', label: 'B4 ⅕', x: 27, y: 90.5, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_dmg', label: 'B4 obraż', x: 32, y: 90.5, w: 9, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_range', label: 'B4 zasięg', x: 41.5, y: 90.5, w: 7, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_attacks', label: 'B4 ataki', x: 49, y: 90.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_ammo', label: 'B4 amu', x: 54.5, y: 90.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_malf', label: 'B4 kaw', x: 60, y: 90.5, w: 5, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 5
  { id: 'weap5_name', label: 'Broń 5 nazwa', x: 3.5, y: 92, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap5_skill', label: 'B5 %', x: 16, y: 92, w: 5.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_half', label: 'B5 ½', x: 22, y: 92, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_fifth', label: 'B5 ⅕', x: 27, y: 92, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_dmg', label: 'B5 obraż', x: 32, y: 92, w: 9, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_range', label: 'B5 zasięg', x: 41.5, y: 92, w: 7, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_attacks', label: 'B5 ataki', x: 49, y: 92, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_ammo', label: 'B5 amu', x: 54.5, y: 92, w: 5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_malf', label: 'B5 kaw', x: 60, y: 92, w: 5, h: 1.3, fontSize: 7, align: 'center' },

  // ── Walka (prawa dolna) ──
  { id: 'damage_bonus', label: 'Mod obrażeń', x: 70, y: 86, w: 10, h: 1.8, fontSize: 10, align: 'center', bold: true },
  { id: 'build', label: 'Krzepa', x: 70, y: 88.5, w: 10, h: 1.8, fontSize: 10, align: 'center', bold: true },
  { id: 'dodge', label: 'Unik', x: 70, y: 93.5, w: 10, h: 1.8, fontSize: 10, align: 'center', bold: true },

  // ── Zasoby (prawa dolna) ──
  { id: 'spending_level', label: 'Poz. wydatków', x: 83, y: 86, w: 12, h: 1.8, fontSize: 9, align: 'center' },
  { id: 'cash', label: 'Gotówka', x: 83, y: 93.5, w: 12, h: 1.8, fontSize: 9, align: 'center' },
]

// ─── BACK CARD (Classic) ──────────────────────────────────────

export const BACK_CLASSIC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 4, y: 5.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'ideology', label: 'Ideologia i przekonania', x: 4, y: 16.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },
  { id: 'significant_people', label: 'Ważne osoby', x: 4, y: 26.5, w: 38, h: 10, fontSize: 9, maxLines: 8 },
  { id: 'meaningful_locations', label: 'Znaczące miejsca', x: 4, y: 38.5, w: 38, h: 7, fontSize: 9, maxLines: 5 },
  { id: 'traits', label: 'Inne przymioty', x: 4, y: 47.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },

  { id: 'equipment', label: 'Ekwipunek', x: 4, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'assets', label: 'Dobytek', x: 28, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'spending_level', label: 'Pozycja', x: 52, y: 82, w: 20, h: 6, fontSize: 8 },
  { id: 'cash', label: 'Gotówka', x: 77, y: 95, w: 16, h: 2, fontSize: 8, align: 'center' },
]

// ─── BACK CARD (ToC / Drive+Pillars) ─────────────────────────

export const BACK_TOC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 4, y: 5.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'pillars', label: 'Filary Poczytalności', x: 4, y: 16.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'sources', label: 'Źródła Stabilności', x: 4, y: 27.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },
  { id: 'drive', label: 'Motywacja', x: 4, y: 37.5, w: 38, h: 7, fontSize: 9, maxLines: 5 },
  { id: 'other_traits', label: 'Inne przymioty', x: 4, y: 46.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },

  { id: 'equipment', label: 'Ekwipunek', x: 4, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'assets', label: 'Dobytek', x: 28, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'spending_level', label: 'Pozycja', x: 52, y: 82, w: 20, h: 6, fontSize: 8 },
  { id: 'cash', label: 'Gotówka', x: 77, y: 95, w: 16, h: 2, fontSize: 8, align: 'center' },
]

// ─── SKILL GRIDS (front card only) ────────────────────────────

export const SKILL_GRID_COL1: SkillColumnGrid = {
  id: 'skills_grid_col1', label: 'Umiejętności kol.1',
  x: 3, y: 21, w: 30, h: 62,
  valueX: 68, halfX: 80, fifthX: 90, cellW: 9,
  rows: [
    { skillId: 'antropologia', type: 'fixed' },
    { skillId: 'archeologia', type: 'fixed' },
    { skillId: 'bron_palna:karabin_strzelba', type: 'fixed' },
    { skillId: 'bron_palna:krotka', type: 'fixed' },
    { skillId: 'bron_palna:_open1', type: 'open_combat', parentSkill: 'bron_palna' },
    { skillId: 'bron_palna:_open2', type: 'open_combat', parentSkill: 'bron_palna' },
    { skillId: 'bron_palna:_open3', type: 'open_combat', parentSkill: 'bron_palna' },
    { skillId: 'charakteryzacja', type: 'fixed' },
    { skillId: 'elektryka', type: 'fixed' },
    { skillId: 'gadanina', type: 'fixed' },
    { skillId: 'historia', type: 'fixed' },
    { skillId: 'jezdziectwo', type: 'fixed' },
    { skillId: 'jezyk_obcy:_open1', type: 'open_spec', parentSkill: 'jezyk_obcy' },
    { skillId: 'jezyk_obcy:_open2', type: 'open_spec', parentSkill: 'jezyk_obcy' },
    { skillId: 'jezyk_obcy:_open3', type: 'open_spec', parentSkill: 'jezyk_obcy' },
    { skillId: 'jezyk_ojczysty', type: 'fixed' },
    { skillId: 'korzystanie_z_bibliotek', type: 'fixed' },
    { skillId: 'ksiegowosc', type: 'fixed' },
    { skillId: 'majetnosc', type: 'fixed' },
    { skillId: 'mechanika', type: 'fixed' },
  ],
}

export const SKILL_GRID_COL2: SkillColumnGrid = {
  id: 'skills_grid_col2', label: 'Umiejętności kol.2',
  x: 35, y: 21, w: 30, h: 62,
  valueX: 68, halfX: 80, fifthX: 90, cellW: 9,
  rows: [
    { skillId: 'medycyna', type: 'fixed' },
    { skillId: 'mity_cthulhu', type: 'fixed' },
    { skillId: 'nasluchiwanie', type: 'fixed' },
    { skillId: 'nauka:_open1', type: 'open_spec', parentSkill: 'nauka' },
    { skillId: 'nauka:_open2', type: 'open_spec', parentSkill: 'nauka' },
    { skillId: 'nauka:_open3', type: 'open_spec', parentSkill: 'nauka' },
    { skillId: 'nawigacja', type: 'fixed' },
    { skillId: 'obsluga_ciezkiego_sprzetu', type: 'fixed' },
    { skillId: 'okultyzm', type: 'fixed' },
    { skillId: 'perswazja', type: 'fixed' },
    { skillId: 'pierwsza_pomoc', type: 'fixed' },
    { skillId: 'pilotowanie:_open1', type: 'open_spec', parentSkill: 'pilotowanie' },
    { skillId: 'pilotowanie:_open2', type: 'open_spec', parentSkill: 'pilotowanie' },
    { skillId: 'plywanie', type: 'fixed' },
    { skillId: 'prawo', type: 'fixed' },
    { skillId: 'prowadzenie_samochodu', type: 'fixed' },
    { skillId: 'psychoanaliza', type: 'fixed' },
    { skillId: 'psychologia', type: 'fixed' },
    { skillId: 'rzucanie', type: 'fixed' },
    { skillId: 'skakanie', type: 'fixed' },
  ],
}

export const SKILL_GRID_COL3: SkillColumnGrid = {
  id: 'skills_grid_col3', label: 'Umiejętności kol.3',
  x: 67, y: 21, w: 27, h: 62,
  valueX: 68, halfX: 80, fifthX: 90, cellW: 9,
  rows: [
    { skillId: 'spostrzegawczosc', type: 'fixed' },
    { skillId: 'sztuka_rzemioslo:_open1', type: 'open_spec', parentSkill: 'sztuka_rzemioslo' },
    { skillId: 'sztuka_rzemioslo:_open2', type: 'open_spec', parentSkill: 'sztuka_rzemioslo' },
    { skillId: 'sztuka_rzemioslo:_open3', type: 'open_spec', parentSkill: 'sztuka_rzemioslo' },
    { skillId: 'sztuka_przetrwania', type: 'fixed' },
    { skillId: 'slusarstwo', type: 'fixed' },
    { skillId: 'tropienie', type: 'fixed' },
    { skillId: 'ukrywanie', type: 'fixed' },
    { skillId: 'unik', type: 'fixed' },
    { skillId: 'urok_osobisty', type: 'fixed' },
    { skillId: 'walka_wrecz:bijatyka', type: 'fixed' },
    { skillId: 'walka_wrecz:_open1', type: 'open_combat', parentSkill: 'walka_wrecz' },
    { skillId: 'walka_wrecz:_open2', type: 'open_combat', parentSkill: 'walka_wrecz' },
    { skillId: 'wiedza_o_naturze', type: 'fixed' },
    { skillId: 'wspinaczka', type: 'fixed' },
    { skillId: 'wycena', type: 'fixed' },
    { skillId: 'zastraszanie', type: 'fixed' },
    { skillId: 'zreczne_palce', type: 'fixed' },
    { skillId: '_custom1', type: 'custom' },
    { skillId: '_custom2', type: 'custom' },
  ],
}

export const FRONT_SKILL_GRIDS: SkillColumnGrid[] = [SKILL_GRID_COL1, SKILL_GRID_COL2, SKILL_GRID_COL3]

export const CARD_LAYOUTS: CardLayout[] = [
  { id: 'front', name: 'Przód', image: '/karta_front.png', fields: FRONT_FIELDS, skillGrids: FRONT_SKILL_GRIDS },
  { id: 'back_classic', name: 'Tył (klasyczny)', image: '/karta_back_v3_classic.png', fields: BACK_CLASSIC_FIELDS },
  { id: 'back_toc', name: 'Tył (Drive+Pillars)', image: '/karta_back_v3_toc.png', fields: BACK_TOC_FIELDS },
]
