/**
 * Coordinate primitives shared by `cardFrontV2.generated.ts` and the PDF
 * exporter. All values are percentages of the A4 card (210×297mm).
 */

export interface BoxV2 {
  x: number
  y: number
  w: number
  h: number
}

/** One row of the regular skills grid (3 cols × 13 rows). */
export interface SkillRowV2 {
  /** Skill ID from `src/data/skills.ts` (e.g. `anthropology`, `library_use`). */
  skillKey: string
  /** Full value cell (`v`). */
  v: BoxV2
  /** Half value cell (`½`). */
  half: BoxV2
  /** Fifth value cell (`⅕`). */
  fifth: BoxV2
}

/** One row of the specializations grid (2 cols, mixed fixed + open slots). */
export interface SpecRowV2 {
  /**
   * For `fixed` rows: the catalog spec ID (e.g. `bron_palna:krotka`).
   * For `open_spec` rows: a synthetic slot ID (`bron_palna:_open1`, …) — the
   * PDF exporter resolves it to the player's matching specialization at
   * render time.
   */
  skillId: string
  slotKind: 'fixed' | 'open_spec'
  /** Parent skill (e.g. `nauka`, `jezyk_obcy`) — set on `open_spec` rows. */
  parent?: string
  /** Box for the spec name text (only present on `open_spec` rows). */
  name?: BoxV2
  v: BoxV2
  half: BoxV2
  fifth: BoxV2
}
