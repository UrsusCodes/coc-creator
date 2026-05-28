import { TIERS, LIFESTYLE_LEVELS } from '@/data/wealthV2'

/**
 * Display formatter for `characters.spending_level`.
 *
 * DB now stores canonical `$N` (per migration 023_spending_level_normalize.sql),
 * but this helper still guards against:
 *   (a) legacy tier labels in case the migration is skipped on a dev/branch DB
 *   (b) [Lifestyle]/[Styl życia] equipment-tag fallback for drafts where
 *       `spending_level` is empty but the wizard's StepEquipment ran
 *   (c) unknown formats → em-dash (U+2014) instead of leaking raw text
 *
 * Output is always `$N` pre-symbol form (e.g. "$7", "$25", "$0.5") or "—".
 *
 * Callers that wrap output in `{char.spending_level && ...}` should keep the
 * conditional — the em-dash is intentional only for non-empty unknown values.
 */
const STAR_PREFIX_RE = /^[\s★☆●·⋅·◆•]+/

function lookupSpending(label: string): string | null {
  if (!label) return null
  // TIERS labels: "Bezdomny", "Ubogi", "Przeciętny", "Zamożny", "Bardzo zamożny", "Bogaty"
  const tier = TIERS.find((t) => t.label === label)
  if (tier) return `$${tier.spending}`
  // LIFESTYLE_LEVELS labels: "Nędzny", "Skromny", "Przeciętny", "Komfortowy", "Elegancki", "Luksusowy"
  const ll = LIFESTYLE_LEVELS.find((l) => l.label === label)
  if (ll) {
    const parentTier = TIERS.find((t) => t.id === ll.tierId)
    if (parentTier) return `$${parentTier.spending}`
  }
  // Historical alias predating wealth v2
  if (label === 'Biedny') return '$2'
  return null
}

export function formatSpendingLevel(
  raw: string | null | undefined,
  equipment: string[] = [],
): string {
  const trimmed = (raw ?? '').toString().trim()

  // 1. Canonical $N form — strip a trailing $ if present (legacy "N$" → "$N").
  if (trimmed.startsWith('$')) {
    const body = trimmed.slice(1).replace(/\$$/, '').trim()
    if (body.length > 0) return `$${body}`
  }

  // 2. Derive a tier/lifestyle label from raw or fall back to [Lifestyle] tag.
  const label = trimmed || (() => {
    const entry = equipment.find(
      (e) => e.startsWith('[Lifestyle]') || e.startsWith('[Styl życia]'),
    )
    return entry
      ? entry.replace(/^\[.*?\]\s*/, '').replace(STAR_PREFIX_RE, '').trim()
      : ''
  })()

  const resolved = lookupSpending(label)
  if (resolved) return resolved

  // 3. Final fallback — em-dash signals "unknown" without leaking raw value.
  return '—'
}
