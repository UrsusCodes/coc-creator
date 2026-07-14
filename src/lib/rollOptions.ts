import type { RollOptions, RollProfile } from '@/types/invite'

/** True when the whole options object carries no active constraint. */
export function rollOptionsAreEmpty(opts: RollOptions | null | undefined): boolean {
  if (!opts) return true
  const profileEmpty = (p: RollProfile | null | undefined): boolean => {
    if (!p) return true
    if (p.avgMin != null || p.avgMax != null) return false
    if (!p.chars) return true
    return !Object.values(p.chars).some(
      (c) => c && (c.fixed != null || c.min != null || c.max != null),
    )
  }
  if (!profileEmpty(opts.initial)) return false
  if (opts.rerolls && opts.rerolls.some((p) => !profileEmpty(p))) return false
  return true
}
