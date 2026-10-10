/**
 * "N damage divided as you choose": one target's share set to `n`, the rest
 * kept whole. Every share is at least 1 and all of it is shared out when the
 * spell is cast (rule 601.2d), so a share grows first from what's unassigned
 * and then from the other shares, the largest first and none below 1; it
 * shrinks by leaving the difference unassigned. The shares never add up past
 * `total`, which a fixed per-share cap let them do (a bug report, 2026-10-10:
 * 7 of 5 with Cast disabled).
 */
export function setShare(shares: readonly number[], i: number, n: number, total: number): number[] {
  const next = [...shares]
  const want = Math.max(1, Math.min(n, total - (shares.length - 1)))
  if (want <= next[i]) {
    next[i] = want
    return next
  }
  let need = want - next[i]
  const free = Math.max(0, total - next.reduce((a, b) => a + b, 0))
  const fromFree = Math.min(need, free)
  next[i] += fromFree
  need -= fromFree
  while (need > 0) {
    let from = -1
    for (let j = 0; j < next.length; j++) {
      if (j !== i && next[j] > 1 && (from < 0 || next[j] > next[from])) from = j
    }
    if (from < 0) break
    next[from] -= 1
    next[i] += 1
    need -= 1
  }
  return next
}
