/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate the half value (rounded down) for a characteristic
 */
export function halfValue(value: number): number {
  return Math.floor(value / 2)
}

/**
 * Calculate the fifth value (rounded down) for a characteristic
 */
export function fifthValue(value: number): number {
  return Math.floor(value / 5)
}

/**
 * Calculate the "easy test" value (łatwy test) for a skill or characteristic:
 * the value doubled, capped at 99. The 99 cap keeps a roll of 100 an automatic
 * failure even on an easy test (CoC convention).
 */
export function easyValue(value: number): number {
  return Math.min(99, value * 2)
}

/**
 * Format a number with sign prefix (+/-)
 */
export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}
