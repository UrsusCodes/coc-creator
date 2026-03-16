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

export interface ListGrid {
  id: string
  label: string
  x: number; y: number; w: number; h: number
  rowCount: number
  fontSize?: number
}

export interface CardLayout {
  id: string
  name: string
  image: string
  fields: FieldBox[]
  skillGrids?: SkillColumnGrid[]
  listGrids?: ListGrid[]
}

// ─── FRONT CARD (2479×3508) ───────────────────────────────────

export const FRONT_FIELDS: FieldBox[] = [
  // ── Zdjęcie ──
  { id: 'photo', label: 'Zdjęcie', x: 5.92, y: 3.93, w: 18.58, h: 19.88, fontSize: 8, align: 'center' },

  // ── Dane Badacza ──
  { id: 'name', label: 'Imię Badacza', x: 34.75, y: 6.71, w: 28, h: 1.5, fontSize: 11, bold: true },
  { id: 'player_name', label: 'Gracz', x: 30.04, y: 9.07, w: 28, h: 1.5, fontSize: 10 },
  { id: 'occupation', label: 'Zawód', x: 30.44, y: 11.53, w: 28, h: 1.5, fontSize: 10 },
  { id: 'age', label: 'Wiek', x: 31.55, y: 13.84, w: 10, h: 1.5, fontSize: 10, align: 'center' },
  { id: 'gender', label: 'Płeć', x: 47.65, y: 13.99, w: 15.5, h: 1.5, fontSize: 10 },
  { id: 'residence', label: 'Miejsce zamieszkania', x: 39.59, y: 16.17, w: 24.37, h: 1.5, fontSize: 9 },
  { id: 'birthplace', label: 'Miejsce urodzenia', x: 37.30, y: 18.63, w: 26.39, h: 1.60, fontSize: 9 },
  { id: 'death_place', label: 'Miejsce śmierci', x: 36.36, y: 20.99, w: 27.33, h: 1.69, fontSize: 9 },

  // ── Cechy — wartości główne ── (top-right 3×3 grid)
  { id: 'char_str', label: 'SIŁ', x: 64.91, y: 7.36, w: 6.06, h: 3.69, fontSize: 13, align: 'center', bold: true },
  { id: 'char_dex', label: 'ZRĘ', x: 74.80, y: 7.23, w: 7, h: 4.07, fontSize: 13, align: 'center', bold: true },
  { id: 'char_pow', label: 'MOC', x: 85.03, y: 7.36, w: 6.33, h: 4.17, fontSize: 13, align: 'center', bold: true },
  { id: 'char_con', label: 'KON', x: 65.05, y: 13.79, w: 6.06, h: 3.60, fontSize: 13, align: 'center', bold: true },
  { id: 'char_app', label: 'WYG', x: 75.20, y: 13.32, w: 6.19, h: 4.26, fontSize: 13, align: 'center', bold: true },
  { id: 'char_edu', label: 'WYK', x: 85.57, y: 13.70, w: 5.79, h: 3.41, fontSize: 13, align: 'center', bold: true },
  { id: 'char_siz', label: 'BUD', x: 64.91, y: 20.03, w: 6.46, h: 3.60, fontSize: 13, align: 'center', bold: true },
  { id: 'char_int', label: 'INT', x: 75.20, y: 20.13, w: 6.19, h: 3.69, fontSize: 13, align: 'center', bold: true },
  { id: 'char_move', label: 'RUCH', x: 85.30, y: 19.75, w: 6.46, h: 4.45, fontSize: 13, align: 'center', bold: true },

  // ── Cechy — połówki ──
  { id: 'char_str_half', label: 'SIŁ ½', x: 71.90, y: 7.54, w: 2.36, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_dex_half', label: 'ZRĘ ½', x: 81.79, y: 7.45, w: 2.49, h: 1.49, fontSize: 9, align: 'center' },
  { id: 'char_pow_half', label: 'MOC ½', x: 92.03, y: 7.54, w: 2.36, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_con_half', label: 'KON ½', x: 71.77, y: 13.97, w: 2.63, h: 1.49, fontSize: 9, align: 'center' },
  { id: 'char_app_half', label: 'WYG ½', x: 82.06, y: 13.88, w: 2.09, h: 1.30, fontSize: 9, align: 'center' },
  { id: 'char_edu_half', label: 'WYK ½', x: 92.29, y: 13.97, w: 1.96, h: 1.39, fontSize: 9, align: 'center' },
  { id: 'char_siz_half', label: 'BUD ½', x: 71.90, y: 20.02, w: 2.22, h: 1.39, fontSize: 9, align: 'center' },
  { id: 'char_int_half', label: 'INT ½', x: 82.06, y: 20.21, w: 2.22, h: 1.39, fontSize: 9, align: 'center' },

  // ── Cechy — piątki ──
  { id: 'char_str_fifth', label: 'SIŁ ⅕', x: 71.91, y: 9.73, w: 2.22, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_dex_fifth', label: 'ZRĘ ⅕', x: 82.06, y: 9.63, w: 2.22, h: 1.49, fontSize: 9, align: 'center' },
  { id: 'char_pow_fifth', label: 'MOC ⅕', x: 92.16, y: 9.63, w: 2.36, h: 1.2, fontSize: 9, align: 'center' },
  { id: 'char_con_fifth', label: 'KON ⅕', x: 71.91, y: 15.87, w: 2.49, h: 1.39, fontSize: 9, align: 'center' },
  { id: 'char_app_fifth', label: 'WYG ⅕', x: 82.06, y: 15.97, w: 2.22, h: 1.30, fontSize: 9, align: 'center' },
  { id: 'char_edu_fifth', label: 'WYK ⅕', x: 92.16, y: 16.06, w: 2.09, h: 1.30, fontSize: 9, align: 'center' },
  { id: 'char_siz_fifth', label: 'BUD ⅕', x: 71.77, y: 22.30, w: 2.90, h: 1.30, fontSize: 9, align: 'center' },
  { id: 'char_int_fifth', label: 'INT ⅕', x: 81.93, y: 22.11, w: 2.36, h: 1.39, fontSize: 9, align: 'center' },

  // ── Atrybuty pochodne ──
  { id: 'san', label: 'Poczytalność', x: 6.08, y: 28.21, w: 8.52, h: 1.51, fontSize: 12, align: 'center', bold: true },
  { id: 'hp', label: 'PW', x: 33.86, y: 28.21, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },
  { id: 'luck', label: 'Szczęście', x: 57.69, y: 28.21, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },
  { id: 'mp', label: 'PM', x: 76.60, y: 28.11, w: 10, h: 1.8, fontSize: 12, align: 'center', bold: true },

  // ── Nazwy specjalizacji (open sloty na karcie) ──
  // Kolumna 1: Broń Palna ×3, Język Obcy ×3
  { id: 'spec_bron_palna_1', label: 'Broń Palna spec.1', x: 13.40, y: 43.71, w: 9.19, h: 1.2, fontSize: 7 },
  { id: 'spec_bron_palna_2', label: 'Broń Palna spec.2', x: 13, y: 46.05, w: 9.73, h: 1.2, fontSize: 7 },
  { id: 'spec_bron_palna_3', label: 'Broń Palna spec.3', x: 13.27, y: 48.67, w: 9.46, h: 1.2, fontSize: 7 },
  { id: 'spec_jezyk_obcy_1', label: 'Język Obcy spec.1', x: 13.94, y: 63.14, w: 9.73, h: 1.01, fontSize: 7 },
  { id: 'spec_jezyk_obcy_2', label: 'Język Obcy spec.2', x: 13.81, y: 67.85, w: 9.33, h: 0.91, fontSize: 7 },
  { id: 'spec_jezyk_obcy_3', label: 'Język Obcy spec.3', x: 14.08, y: 65.62, w: 9.06, h: 0.91, fontSize: 7 },
  // Kolumna 2: Nauka ×3, Pilotaż ×2
  { id: 'spec_nauka_1', label: 'Nauka spec.1', x: 41.98, y: 41.40, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_nauka_2', label: 'Nauka spec.2', x: 41.98, y: 43.83, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_nauka_3', label: 'Nauka spec.3', x: 42.12, y: 46.07, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_pilotaz_1', label: 'Pilotaż spec.1', x: 41.85, y: 60.56, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_pilotaz_2', label: 'Pilotaż spec.2', x: 41.71, y: 62.99, w: 10, h: 1.2, fontSize: 7 },
  // Kolumna 3: Szt./Rzem. ×3, Walka Wręcz ×2
  { id: 'spec_sztuka_1', label: 'Szt./Rzem. spec.1', x: 73.73, y: 36.76, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_sztuka_2', label: 'Szt./Rzem. spec.2', x: 73.73, y: 39.09, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_sztuka_3', label: 'Szt./Rzem. spec.3', x: 73.60, y: 41.43, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_walka_1', label: 'Walka Wr. spec.1', x: 74.27, y: 60.46, w: 10, h: 1.2, fontSize: 7 },
  { id: 'spec_walka_2', label: 'Walka Wr. spec.2', x: 74.54, y: 62.89, w: 10, h: 1.2, fontSize: 7 },

  // ── Uzbrojenie — 5 rzędów × kolumny ──
  // Nagłówki: BROŃ | NORMA | ½ | ⅕ | OBRAŻENIA | ZASIĘG | ATAKI | AMU. | KAW.
  // Broń 1
  { id: 'weap1_name', label: 'Broń 1 nazwa', x: 5.92, y: 87.42, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap1_skill', label: 'B1 %', x: 21.08, y: 87.37, w: 4.61, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap1_half', label: 'B1 ½', x: 26.94, y: 87.43, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_fifth', label: 'B1 ⅕', x: 32.0, y: 87.43, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_dmg', label: 'B1 obraż', x: 37.52, y: 87.4, w: 7.39, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap1_range', label: 'B1 zasięg', x: 45.78, y: 87.31, w: 4.9, h: 1.47, fontSize: 7, align: 'center' },
  { id: 'weap1_attacks', label: 'B1 ataki', x: 51.48, y: 87.43, w: 4.11, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap1_ammo', label: 'B1 amu', x: 56.11, y: 87.48, w: 3.79, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap1_malf', label: 'B1 kaw', x: 60.56, y: 87.43, w: 3.23, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 2
  { id: 'weap2_name', label: 'Broń 2 nazwa', x: 5.82, y: 89.31, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap2_skill', label: 'B2 %', x: 21.08, y: 89.27, w: 4.61, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap2_half', label: 'B2 ½', x: 26.84, y: 89.21, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_fifth', label: 'B2 ⅕', x: 32.0, y: 89.33, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_dmg', label: 'B2 obraż', x: 37.52, y: 89.2, w: 7.39, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap2_range', label: 'B2 zasięg', x: 45.86, y: 89.21, w: 4.82, h: 1.41, fontSize: 7, align: 'center' },
  { id: 'weap2_attacks', label: 'B2 ataki', x: 51.54, y: 89.17, w: 3.87, h: 1.41, fontSize: 7, align: 'center' },
  { id: 'weap2_ammo', label: 'B2 amu', x: 56.19, y: 89.21, w: 3.63, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap2_malf', label: 'B2 kaw', x: 60.4, y: 89.21, w: 3.71, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 3
  { id: 'weap3_name', label: 'Broń 3 nazwa', x: 5.82, y: 91.22, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap3_skill', label: 'B3 %', x: 21.08, y: 91.11, w: 4.61, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap3_half', label: 'B3 ½', x: 26.9, y: 91.11, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_fifth', label: 'B3 ⅕', x: 32.0, y: 91.23, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_dmg', label: 'B3 obraż', x: 37.52, y: 91.2, w: 7.39, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap3_range', label: 'B3 zasięg', x: 45.86, y: 91.11, w: 4.74, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_attacks', label: 'B3 ataki', x: 51.66, y: 91.17, w: 3.87, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap3_ammo', label: 'B3 amu', x: 56.19, y: 91.11, w: 3.55, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap3_malf', label: 'B3 kaw', x: 60.48, y: 91.11, w: 3.71, h: 1.3, fontSize: 7, align: 'center' },

  // Broń 4
  { id: 'weap4_name', label: 'Broń 4 nazwa', x: 5.82, y: 93.01, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap4_skill', label: 'B4 %', x: 21.16, y: 92.95, w: 4.61, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap4_half', label: 'B4 ½', x: 26.92, y: 92.95, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_fifth', label: 'B4 ⅕', x: 32.0, y: 93.03, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap4_dmg', label: 'B4 obraż', x: 37.52, y: 93.0, w: 7.39, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap4_range', label: 'B4 zasięg', x: 45.94, y: 93.01, w: 4.58, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap4_attacks', label: 'B4 ataki', x: 51.72, y: 93.07, w: 3.79, h: 1.24, fontSize: 7, align: 'center' },
  { id: 'weap4_ammo', label: 'B4 amu', x: 56.27, y: 93.01, w: 3.63, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap4_malf', label: 'B4 kaw', x: 60.48, y: 92.89, w: 3.63, h: 1.36, fontSize: 7, align: 'center' },

  // Broń 5
  { id: 'weap5_name', label: 'Broń 5 nazwa', x: 5.88, y: 94.91, w: 12, h: 1.3, fontSize: 7 },
  { id: 'weap5_skill', label: 'B5 %', x: 21.16, y: 94.85, w: 4.61, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap5_half', label: 'B5 ½', x: 26.92, y: 94.85, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_fifth', label: 'B5 ⅕', x: 32.04, y: 94.89, w: 4.5, h: 1.3, fontSize: 7, align: 'center' },
  { id: 'weap5_dmg', label: 'B5 obraż', x: 37.52, y: 94.8, w: 7.39, h: 1.36, fontSize: 7, align: 'center' },
  { id: 'weap5_range', label: 'B5 zasięg', x: 45.94, y: 94.85, w: 4.58, h: 1.24, fontSize: 7, align: 'center' },
  { id: 'weap5_attacks', label: 'B5 ataki', x: 51.74, y: 94.68, w: 3.55, h: 1.41, fontSize: 7, align: 'center' },
  { id: 'weap5_ammo', label: 'B5 amu', x: 56.36, y: 94.86, w: 3.47, h: 1.24, fontSize: 7, align: 'center' },
  { id: 'weap5_malf', label: 'B5 kaw', x: 60.48, y: 94.85, w: 3.47, h: 1.24, fontSize: 7, align: 'center' },

  // ── Walka (prawa dolna) ──
  { id: 'damage_bonus', label: 'Mod obrażeń', x: 69.19, y: 85.24, w: 4.89, h: 1.99, fontSize: 10, align: 'center', bold: true },
  { id: 'build', label: 'Krzepa', x: 69.60, y: 88.98, w: 4.35, h: 1.90, fontSize: 10, align: 'center', bold: true },
  { id: 'dodge', label: 'Unik', x: 69.33, y: 92.45, w: 4.62, h: 1.8, fontSize: 10, align: 'center', bold: true },

  // ── Zasoby (prawa dolna) ──
  { id: 'spending_level', label: 'Poz. wydatków', x: 84.88, y: 85.24, w: 4.07, h: 2.18, fontSize: 9, align: 'center' },
  { id: 'cash', label: 'Gotówka', x: 84.56, y: 88.67, w: 4.60, h: 2.18, fontSize: 9, align: 'center' },
]

// ─── BACK CARD (Classic) ──────────────────────────────────────

export const BACK_CLASSIC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 5.94, y: 10.06, w: 32.27, h: 9.40, fontSize: 9, maxLines: 7 },
  { id: 'ideology', label: 'Ideologia i przekonania', x: 5.69, y: 21.52, w: 32.43, h: 5.66, fontSize: 9, maxLines: 6 },
  { id: 'significant_people', label: 'Ważne osoby', x: 5.37, y: 29.86, w: 33.08, h: 6.07, fontSize: 9, maxLines: 8 },
  { id: 'meaningful_locations', label: 'Znaczące miejsca', x: 5.61, y: 37.99, w: 32.68, h: 6.26, fontSize: 9, maxLines: 5 },
  { id: 'traits', label: 'Inne przymioty', x: 5.53, y: 46.42, w: 32.19, h: 9.08, fontSize: 9, maxLines: 6 },
]

// ── Bottom section fields shared by both back cards (hardcoded positions) ──
const BACK_BOTTOM_FIELDS: FieldBox[] = [
  // Ekwipunek lewa kolumna (12 wierszy)
  { id: 'equip_l_1',  label: 'Ekwip.L1',  x: 5.748,  y: 72.475, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_2',  label: 'Ekwip.L2',  x: 5.748,  y: 74.675, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_3',  label: 'Ekwip.L3',  x: 5.748,  y: 76.575, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_4',  label: 'Ekwip.L4',  x: 5.748,  y: 78.675, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_5',  label: 'Ekwip.L5',  x: 5.748,  y: 80.575, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_6',  label: 'Ekwip.L6',  x: 5.748,  y: 82.675, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_7',  label: 'Ekwip.L7',  x: 5.748,  y: 84.575, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_8',  label: 'Ekwip.L8',  x: 5.748,  y: 86.575, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_9',  label: 'Ekwip.L9',  x: 5.748,  y: 88.775, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_10', label: 'Ekwip.L10', x: 5.748,  y: 90.675, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_11', label: 'Ekwip.L11', x: 5.748,  y: 92.775, w: 18.875, h: 1.405, fontSize: 7 },
  { id: 'equip_l_12', label: 'Ekwip.L12', x: 5.748,  y: 94.705, w: 18.875, h: 1.405, fontSize: 7 },
  // Ekwipunek prawa kolumna (12 wierszy)
  { id: 'equip_r_1',  label: 'Ekwip.R1',  x: 27.833, y: 72.475, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_2',  label: 'Ekwip.R2',  x: 27.833, y: 74.575, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_3',  label: 'Ekwip.R3',  x: 27.833, y: 76.575, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_4',  label: 'Ekwip.R4',  x: 27.833, y: 78.575, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_5',  label: 'Ekwip.R5',  x: 27.833, y: 80.575, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_6',  label: 'Ekwip.R6',  x: 27.833, y: 82.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_7',  label: 'Ekwip.R7',  x: 27.833, y: 84.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_8',  label: 'Ekwip.R8',  x: 27.833, y: 86.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_9',  label: 'Ekwip.R9',  x: 27.833, y: 88.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_10', label: 'Ekwip.R10', x: 27.833, y: 90.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_11', label: 'Ekwip.R11', x: 27.833, y: 92.675, w: 18.337, h: 1.5, fontSize: 7 },
  { id: 'equip_r_12', label: 'Ekwip.R12', x: 27.833, y: 94.675, w: 18.337, h: 1.5, fontSize: 7 },
  // Dobytek (12 wierszy)
  { id: 'asset_1',  label: 'Dobytek 1',  x: 50.304, y: 72.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_2',  label: 'Dobytek 2',  x: 50.304, y: 74.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_3',  label: 'Dobytek 3',  x: 50.304, y: 76.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_4',  label: 'Dobytek 4',  x: 50.304, y: 78.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_5',  label: 'Dobytek 5',  x: 50.304, y: 80.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_6',  label: 'Dobytek 6',  x: 50.304, y: 82.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_7',  label: 'Dobytek 7',  x: 50.304, y: 84.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_8',  label: 'Dobytek 8',  x: 50.304, y: 86.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_9',  label: 'Dobytek 9',  x: 50.304, y: 88.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_10', label: 'Dobytek 10', x: 50.304, y: 90.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_11', label: 'Dobytek 11', x: 50.304, y: 92.57, w: 18, h: 1.5, fontSize: 7 },
  { id: 'asset_12', label: 'Dobytek 12', x: 50.304, y: 94.57, w: 18, h: 1.5, fontSize: 7 },
  // Pozycja (6 wierszy)
  { id: 'position_1', label: 'Pozycja 1', x: 73.321, y: 72.19, w: 18, h: 1.5, fontSize: 7 },
  { id: 'position_2', label: 'Pozycja 2', x: 73.152, y: 74.29, w: 18, h: 1.5, fontSize: 7 },
  { id: 'position_3', label: 'Pozycja 3', x: 73.152, y: 76.19, w: 18, h: 1.5, fontSize: 7 },
  { id: 'position_4', label: 'Pozycja 4', x: 73.152, y: 78.09, w: 18, h: 1.5, fontSize: 7 },
  { id: 'position_5', label: 'Pozycja 5', x: 73.152, y: 79.99, w: 18, h: 1.5, fontSize: 7 },
  { id: 'position_6', label: 'Pozycja 6', x: 73.152, y: 81.89, w: 18, h: 1.5, fontSize: 7 },
  // Kontakty (6 wierszy)
  { id: 'contact_1', label: 'Kontakt 1', x: 72.749, y: 85.241, w: 18, h: 1.5, fontSize: 7 },
  { id: 'contact_2', label: 'Kontakt 2', x: 72.749, y: 87.041, w: 18, h: 1.5, fontSize: 7 },
  { id: 'contact_3', label: 'Kontakt 3', x: 72.749, y: 89.041, w: 18, h: 1.5, fontSize: 7 },
  { id: 'contact_4', label: 'Kontakt 4', x: 72.749, y: 90.841, w: 18, h: 1.5, fontSize: 7 },
  { id: 'contact_5', label: 'Kontakt 5', x: 72.749, y: 92.741, w: 18, h: 1.5, fontSize: 7 },
  { id: 'contact_6', label: 'Kontakt 6', x: 72.749, y: 94.641, w: 18, h: 1.5, fontSize: 7 },
]

// Append bottom fields to classic back
BACK_CLASSIC_FIELDS.push(...BACK_BOTTOM_FIELDS)

// ─── BACK CARD (ToC / Drive+Pillars) ─────────────────────────

export const BACK_TOC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 5.69, y: 10.06, w: 32.43, h: 8.26, fontSize: 9, maxLines: 7 },
  { id: 'pillars', label: 'Filary Poczytalności', x: 6.18, y: 21.63, w: 32.35, h: 9.40, fontSize: 9, maxLines: 7 },
  { id: 'sources', label: 'Źródła Stabilności', x: 5.53, y: 29.95, w: 32.03, h: 5.66, fontSize: 9, maxLines: 6 },
  { id: 'drive', label: 'Motywacja', x: 5.77, y: 38.18, w: 32.27, h: 5.86, fontSize: 9, maxLines: 5 },
  { id: 'other_traits', label: 'Inne przymioty', x: 5.86, y: 46.44, w: 32.35, h: 9.31, fontSize: 9, maxLines: 6 },
]

// Append same bottom fields to ToC back
BACK_TOC_FIELDS.push(...BACK_BOTTOM_FIELDS)

// ─── SKILL GRIDS (front card only) ────────────────────────────

export const SKILL_GRID_COL1: SkillColumnGrid = {
  id: 'skills_grid_col1', label: 'Umiejętności kol.1',
  x: 15.10, y: 33.83, w: 19.11, h: 47.94,
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
  x: 42.93, y: 33.92, w: 22.20, h: 48.03,
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
  x: 73.88, y: 33.78, w: 20.71, h: 48.14,
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
