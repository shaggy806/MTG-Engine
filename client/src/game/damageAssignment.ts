/**
 * The damage-assignment bar's model: an attacker's blockers folded into
 * groups of interchangeable creatures, and the edits the bar and the board
 * make to the per-blocker amounts the engine takes as its answer.
 *
 * Why groups: the bar used to be one number input per blocker, which is fine
 * for two and unusable for twenty. A token stack blocks as one creature per
 * token (the engine materializes it for combat), so twenty Goblins blocking a
 * trampler put twenty identical rows on screen, taller than the quadrant it
 * floated over. Blockers the same in everything the board shows, and needing
 * the same damage to be lethal, are one row with one total. Which of them
 * takes that damage can't matter, because nothing tells them apart.
 *
 * The answer keeps the engine's own shape: one amount per blocker, in the
 * offer's order. Nothing here crosses the wire, and the legality check stays
 * the engine's `damageAssignmentViolations`.
 */

import type { LegalAction, ObjectId, PlayerView, VisibleObject } from 'engine'

export type AssignDamageOffer = Extract<LegalAction, { kind: 'assign-combat-damage' }>

export interface BlockerGroup {
  /** Indices into the offer's `blockers` and `lethal`, in offer order. */
  readonly members: readonly number[]
  /** Damage lethal to each member. The same for all of them: it's part of
   * what makes them one group. */
  readonly lethal: number
  /** The name, with `×n` when the group has more than one member. */
  readonly label: string
  /** P/T, lethal, and whatever else sets this group apart from another of
   * the same name. */
  readonly detail: string
}

const sum = (xs: readonly number[]): number => xs.reduce((s, n) => s + n, 0)

/** What makes two blockers interchangeable: everything the view shows about
 * them except their id, how many tokens a stack stands for, and summoning
 * sickness, which can't matter to a creature about to be dealt damage. What's
 * attached to one is on other objects, so it's keyed separately. */
function identityKey(obj: VisibleObject): string {
  const { id: _id, stackCount: _stackCount, summoningSick: _sick, ...shown } = obj
  return JSON.stringify(shown)
}

/** The words telling a blocker apart from another of the same name and
 * P/T, most telling first. */
function markers(obj: VisibleObject, attached: readonly VisibleObject[]): string[] {
  const out: string[] = []
  if (obj.isCommander) out.push('commander')
  if (obj.keywords.includes('indestructible')) out.push('indestructible')
  if (attached.some((a) => a.subtypes.includes('Equipment'))) out.push('equipped')
  if (attached.some((a) => a.subtypes.includes('Aura'))) out.push('enchanted')
  for (const [kind, n] of Object.entries(obj.counters)) out.push(`${n} ${kind}`)
  if (obj.tapped) out.push('tapped')
  return out
}

/** The offer's blockers as the bar's rows, in the order each group's first
 * member was declared. */
export function groupBlockers(offer: AssignDamageOffer, view: PlayerView): BlockerGroup[] {
  const attachedTo = new Map<ObjectId, VisibleObject[]>()
  for (const id of view.zones.battlefield) {
    const obj = view.objects[id]
    if (obj?.attachedTo) attachedTo.set(obj.attachedTo, [...(attachedTo.get(obj.attachedTo) ?? []), obj])
  }

  const building: { members: number[]; sample: VisibleObject | undefined; lethal: number }[] = []
  const byKey = new Map<string, number>()
  offer.blockers.forEach((id, index) => {
    const obj = view.objects[id]
    const attached = attachedTo.get(id) ?? []
    // Anything attached makes a blocker its own row: an Aura or Equipment is
    // attached to exactly one creature, so its id can't match another's.
    const key = obj
      ? JSON.stringify([offer.lethal[index], attached.map((a) => a.id), identityKey(obj)])
      : `unseen:${id}`
    const at = byKey.get(key)
    if (at !== undefined) {
      building[at].members.push(index)
      return
    }
    byKey.set(key, building.length)
    building.push({ members: [index], sample: obj, lethal: offer.lethal[index] })
  })

  const groups = building.map(({ members, sample, lethal }): BlockerGroup => {
    const name = sample ? (sample.faceName ?? sample.cardName) : 'Blocker'
    const each = members.length > 1 ? ' each' : ''
    const parts = [
      ...(sample && sample.power !== null && sample.toughness !== null
        ? [`${sample.power}/${sample.toughness}`]
        : []),
      ...(sample ? markers(sample, attachedTo.get(sample.id) ?? []) : []),
      `lethal ${lethal}${each}`,
    ]
    return {
      members,
      lethal,
      label: members.length > 1 ? `${name} ×${members.length}` : name,
      detail: parts.join(' · '),
    }
  })

  // Two rows that still read the same differ in something the row doesn't
  // spell out (a granted keyword, a different owner). Number them rather than
  // show two identical lines.
  const seen = new Map<string, number>()
  for (const g of groups) seen.set(`${g.label}|${g.detail}`, (seen.get(`${g.label}|${g.detail}`) ?? 0) + 1)
  const numbered = new Map<string, number>()
  return groups.map((g) => {
    const text = `${g.label}|${g.detail}`
    if ((seen.get(text) ?? 0) < 2) return g
    const n = (numbered.get(text) ?? 0) + 1
    numbered.set(text, n)
    return { ...g, label: `${g.label} (${n})` }
  })
}

/** Damage on no blocker yet: what tramples over, or what still has to go
 * somewhere. */
export function unassigned(offer: AssignDamageOffer, picks: readonly number[]): number {
  return offer.power - sum(picks)
}

export function totalOf(members: readonly number[], picks: readonly number[]): number {
  return sum(members.map((m) => picks[m]))
}

/** How many of `members` have lethal damage assigned: what trample checks
 * (rule 702.19b), whether or not it kills them. */
export function lethalCount(
  offer: AssignDamageOffer,
  members: readonly number[],
  picks: readonly number[],
): number {
  return members.filter((m) => picks[m] >= offer.lethal[m]).length
}

/** The blockers lethal damage won't kill, by their index in the offer:
 * indestructible ones. Trample still needs lethal on them first; they just
 * don't die of it, so the bar mustn't draw them as dying. */
export function survivorsOf(offer: AssignDamageOffer, view: PlayerView): ReadonlySet<number> {
  const out = new Set<number>()
  offer.blockers.forEach((id, i) => {
    if (view.objects[id]?.keywords.includes('indestructible')) out.add(i)
  })
  return out
}

/** How many of `members` die of the damage assigned. */
export function deathCount(
  offer: AssignDamageOffer,
  members: readonly number[],
  picks: readonly number[],
  survivors: ReadonlySet<number>,
): number {
  return members.filter((m) => !survivors.has(m) && picks[m] >= offer.lethal[m]).length
}

/**
 * Another of `members` to lethal: the one closest to it already (ties to the
 * first declared), so a creature with some damage on it is finished before a
 * fresh one is started.
 *
 * The damage comes from what nobody has yet, and past that from the other
 * blockers, wherever taking it kills least: damage beyond lethal first, then
 * damage too little to kill, then the blockers with the least lethal (the
 * last declared, of equals). The standard split spends everything on the
 * cheapest kills, so clicking the one creature you actually want dead has to
 * be able to move damage off a pile of tokens without a separate step.
 * Others are only robbed to get this one all the way to lethal; short of
 * that, it gets whatever is free. `null` when nothing can be added.
 */
export function topUp(
  offer: AssignDamageOffer,
  members: readonly number[],
  picks: readonly number[],
): number[] | null {
  const short = members.filter((m) => picks[m] < offer.lethal[m])
  if (short.length === 0) return null
  const need = (m: number) => offer.lethal[m] - picks[m]
  const next = short.reduce((best, m) => (need(m) < need(best) ? m : best))
  const free = Math.max(0, unassigned(offer, picks))
  const out = [...picks]
  let wanted = need(next) - free
  if (wanted <= 0) {
    out[next] += need(next)
    return out
  }
  // Later-declared blockers give first, so the ones declared first keep
  // what they have for longest.
  const others = offer.blockers.map((_, i) => i).filter((i) => !members.includes(i)).reverse()
  if (totalOf(others, picks) < wanted) {
    if (free === 0) return null
    out[next] += free
    return out
  }
  out[next] += need(next)
  const take = (i: number, most: number) => {
    const n = Math.min(most, wanted)
    out[i] -= n
    wanted -= n
  }
  for (const i of others) if (wanted > 0) take(i, Math.max(0, out[i] - offer.lethal[i]))
  for (const i of others) if (wanted > 0 && out[i] < offer.lethal[i]) take(i, out[i])
  const cheapest = others.filter((i) => out[i] > 0).sort((a, b) => offer.lethal[a] - offer.lethal[b])
  for (const i of cheapest) if (wanted > 0) take(i, out[i])
  return out
}

/**
 * The row's `+`: {@link topUp}, or with every member already lethal, more on
 * the last of them, out of the free damage only. Without trample that's all the free damage at once: a
 * creature that can't trample has to put its whole power on its blockers, so
 * after sparing one, the damage that freed up needs somewhere to go. With
 * trample it's one point, taken back from what would have gone over.
 */
export function addToGroup(
  offer: AssignDamageOffer,
  members: readonly number[],
  picks: readonly number[],
): number[] | null {
  const topped = topUp(offer, members, picks)
  if (topped) return topped
  const free = unassigned(offer, picks)
  if (free <= 0 || members.length === 0) return null
  const out = [...picks]
  out[members[members.length - 1]] += offer.trample ? 1 : free
  return out
}

/** The row's `−`: the member with the least damage on it (ties to the last
 * declared) back to none, so each press spares one more creature. */
export function spareOne(members: readonly number[], picks: readonly number[]): number[] | null {
  const damaged = members.filter((m) => picks[m] > 0)
  if (damaged.length === 0) return null
  const next = damaged.reduce((best, m) => (picks[m] <= picks[best] ? m : best))
  const out = [...picks]
  out[next] = 0
  return out
}

/** A total typed into a row, spread over its members: lethal to each in
 * turn, what's left on the next, anything past all of them on the last.
 * Clamped to what the row can take. */
export function setGroupTotal(
  offer: AssignDamageOffer,
  group: BlockerGroup,
  picks: readonly number[],
  total: number,
): number[] {
  const most = totalOf(group.members, picks) + Math.max(0, unassigned(offer, picks))
  let left = Math.min(Math.max(0, Math.floor(total)), most)
  const out = [...picks]
  group.members.forEach((m, i) => {
    const give = i === group.members.length - 1 ? left : Math.min(left, group.lethal)
    out[m] = give
    left -= give
  })
  return out
}

/** A click on a board tile standing for `members`: one more of them to
 * lethal ({@link topUp}) if there's damage to be had for it, and otherwise
 * all of them spared. For a single creature that's a toggle, and for a
 * folded token stack it counts up one creature per click, then clears. */
export function clickMembers(
  offer: AssignDamageOffer,
  members: readonly number[],
  picks: readonly number[],
): number[] {
  const topped = topUp(offer, members, picks)
  if (topped) return topped
  const out = [...picks]
  for (const m of members) out[m] = 0
  return out
}
