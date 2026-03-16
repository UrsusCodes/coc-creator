/**
 * Card field layout definitions.
 * Coordinates are in percentage (0-100) of the card image dimensions (2479x3508).
 * This allows the layout to scale to any rendering size.
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

export interface CardLayout {
  id: string
  name: string
  image: string
  fields: FieldBox[]
}

// ─── FRONT CARD (2479×3508) ───────────────────────────────────
// Dane Badacza top-left, Cechy top-right, skills middle, weapons bottom

export const FRONT_FIELDS: FieldBox[] = [
  // Dane badacza (left column)
  { id: 'name', label: 'Imię Badacza', x: 13.5, y: 3.2, w: 28, h: 1.6, fontSize: 11, bold: true },
  { id: 'player_name', label: 'Gracz', x: 13.5, y: 4.9, w: 28, h: 1.6, fontSize: 10 },
  { id: 'occupation', label: 'Zawód', x: 13.5, y: 6.6, w: 28, h: 1.6, fontSize: 10 },
  { id: 'age', label: 'Wiek', x: 13.5, y: 8.3, w: 10, h: 1.6, fontSize: 10, align: 'center' },
  { id: 'gender', label: 'Płeć', x: 26, y: 8.3, w: 15.5, h: 1.6, fontSize: 10 },
  { id: 'residence', label: 'Miejsce zamieszkania', x: 13.5, y: 10.0, w: 28, h: 1.6, fontSize: 9 },
  { id: 'birthplace', label: 'Miejsce urodzenia', x: 13.5, y: 11.7, w: 28, h: 1.6, fontSize: 9 },

  // Cechy — top-right grid (3 columns × 3 rows)
  { id: 'char_str', label: 'SIŁ', x: 55, y: 2.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_dex', label: 'ZRĘ', x: 67, y: 2.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_pow', label: 'MOC', x: 80, y: 2.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_con', label: 'KON', x: 55, y: 5.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_app', label: 'WYG', x: 67, y: 5.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_edu', label: 'WYK', x: 80, y: 5.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_siz', label: 'BUD', x: 55, y: 8.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_int', label: 'INT', x: 67, y: 8.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },
  { id: 'char_move', label: 'RUCH', x: 80, y: 8.8, w: 10, h: 2.2, fontSize: 14, align: 'center', bold: true },

  // Derived stats row (below dane + cechy)
  { id: 'san', label: 'Poczytalność', x: 5, y: 15.0, w: 12, h: 2.0, fontSize: 12, align: 'center', bold: true },
  { id: 'hp', label: 'PW', x: 27, y: 15.0, w: 12, h: 2.0, fontSize: 12, align: 'center', bold: true },
  { id: 'luck', label: 'Szczęście', x: 55, y: 15.0, w: 12, h: 2.0, fontSize: 12, align: 'center', bold: true },
  { id: 'mp', label: 'PM', x: 77, y: 15.0, w: 12, h: 2.0, fontSize: 12, align: 'center', bold: true },
  { id: 'db_build', label: 'PO/Krzepa', x: 88, y: 12.0, w: 8, h: 1.5, fontSize: 9, align: 'center' },

  // Uzbrojenie (bottom area ~88%)
  { id: 'weapon_1', label: 'Broń 1', x: 4, y: 89.0, w: 75, h: 1.3, fontSize: 8 },
  { id: 'weapon_2', label: 'Broń 2', x: 4, y: 90.5, w: 75, h: 1.3, fontSize: 8 },
  { id: 'dodge', label: 'Unik', x: 84, y: 93.0, w: 10, h: 1.5, fontSize: 10, align: 'center' },
  { id: 'cash', label: 'Gotówka', x: 84, y: 95.5, w: 10, h: 1.5, fontSize: 9, align: 'center' },
]

// ─── BACK CARD (Classic) ──────────────────────────────────────
// Left: opis postaci, ideologia, ważne osoby, znaczące miejsca, inne przymioty
// Right: dziennik spraw (not editable), bottom: ekwipunek etc.

export const BACK_CLASSIC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 4, y: 5.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'ideology', label: 'Ideologia i przekonania', x: 4, y: 16.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },
  { id: 'significant_people', label: 'Ważne osoby', x: 4, y: 26.5, w: 38, h: 10, fontSize: 9, maxLines: 8 },
  { id: 'meaningful_locations', label: 'Znaczące miejsca', x: 4, y: 38.5, w: 38, h: 7, fontSize: 9, maxLines: 5 },
  { id: 'traits', label: 'Inne przymioty', x: 4, y: 47.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },

  // Bottom sections
  { id: 'equipment', label: 'Ekwipunek', x: 4, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'assets', label: 'Dobytek', x: 28, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'spending_level', label: 'Pozycja', x: 52, y: 82, w: 20, h: 6, fontSize: 8 },
  { id: 'cash', label: 'Gotówka', x: 77, y: 95, w: 16, h: 2, fontSize: 8, align: 'center' },
]

// ─── BACK CARD (ToC / Drive+Pillars) ─────────────────────────
// Left: opis, filary, źródła, motywacja, inne przymioty

export const BACK_TOC_FIELDS: FieldBox[] = [
  { id: 'appearance_description', label: 'Opis postaci', x: 4, y: 5.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'pillars', label: 'Filary Poczytalności', x: 4, y: 16.5, w: 38, h: 9, fontSize: 9, maxLines: 7 },
  { id: 'sources', label: 'Źródła Stabilności', x: 4, y: 27.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },
  { id: 'drive', label: 'Motywacja', x: 4, y: 37.5, w: 38, h: 7, fontSize: 9, maxLines: 5 },
  { id: 'other_traits', label: 'Inne przymioty', x: 4, y: 46.5, w: 38, h: 8, fontSize: 9, maxLines: 6 },

  // Same bottom sections as classic
  { id: 'equipment', label: 'Ekwipunek', x: 4, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'assets', label: 'Dobytek', x: 28, y: 82, w: 20, h: 12, fontSize: 8, maxLines: 10 },
  { id: 'spending_level', label: 'Pozycja', x: 52, y: 82, w: 20, h: 6, fontSize: 8 },
  { id: 'cash', label: 'Gotówka', x: 77, y: 95, w: 16, h: 2, fontSize: 8, align: 'center' },
]

export const CARD_LAYOUTS: CardLayout[] = [
  { id: 'front', name: 'Przód', image: '/karta_front.png', fields: FRONT_FIELDS },
  { id: 'back_classic', name: 'Tył (klasyczny)', image: '/karta_back_v3_classic.png', fields: BACK_CLASSIC_FIELDS },
  { id: 'back_toc', name: 'Tył (Drive+Pillars)', image: '/karta_back_v3_toc.png', fields: BACK_TOC_FIELDS },
]
