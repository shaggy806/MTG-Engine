/**
 * A die roll (rule 706), thrown onto the table: each die tumbles in from the
 * roller's side of the table, bounces a few times and settles on the result
 * the engine rolled (`dice-rolled` carries every die's natural result, so the
 * landing is decided before the throw). The paths come from a generator
 * seeded by the event, so every viewer sees the same throw.
 *
 * Outside React, like `floatText`: a `.dice-roll` box on `<body>` holding a
 * caption and the dice, removed when its beat (`DICE_STEP_MS`) is over.
 * Reduced motion sets the dice down in place with their results showing.
 */

/** Dice drawn at once; a bigger roll lists the rest in the caption. */
export const MAX_DICE_SHOWN = 12

/** The phases of the beat, as fractions of `DICE_STEP_MS`. */
const THROW_SHARE = 0.6
const FADE_SHARE = 0.1
/** When the dice first strike the table, as a fraction of the throw. */
const FIRST_STRIKE = 0.38

/** How long after a roll's beat starts its dice first hit the table: when
 * its sound goes. At once under reduced motion, which sets them down. */
export function diceStrikeMs(durationMs: number, reduced: boolean): number {
  return reduced ? 0 : durationMs * THROW_SHARE * FIRST_STRIKE
}

/** mulberry32: a small seeded generator, the same numbers on every client. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The die's outline: a d4 a triangle, a d6 a rounded square, a d8 a
 * diamond, a d10 a kite, a d12 a pentagon, anything else a hexagon. */
function shapeOf(sides: number): string {
  switch (sides) {
    case 4:
      return 'd4'
    case 6:
      return 'd6'
    case 8:
      return 'd8'
    case 10:
      return 'd10'
    case 12:
      return 'd12'
    default:
      return 'd20'
  }
}

/** "a d20", "two d6", "4d6" — what the caption calls the roll. */
function rollName(count: number, sides: number): string {
  if (count === 1) return `a d${sides}`
  return `${count}d${sides}`
}

export interface DiceThrow {
  readonly seq: number
  readonly sides: number
  readonly results: readonly number[]
  /** Who rolled, as the caption names them, and their seat colour class. */
  readonly who: string
  readonly seatClass: string
  /** Where the dice come from: an offset in px from the viewport's centre
   * (the roller's quadrant). */
  readonly from: { readonly x: number; readonly y: number }
  /** The beat, already at the viewer's speed. */
  readonly durationMs: number
  readonly reduced: boolean
}

export function throwDice(roll: DiceThrow): void {
  const random = seeded(roll.seq * 7919 + roll.sides * 31 + roll.results.length)
  const shown = roll.results.slice(0, MAX_DICE_SHOWN)
  const total = roll.results.reduce((n, r) => n + r, 0)

  const box = document.createElement('div')
  box.className = `dice-roll ${roll.seatClass}`
  box.dataset.rollSeq = String(roll.seq)
  // The dice are the roller's colour.
  box.style.setProperty('--die', `var(--${roll.seatClass})`)
  const caption = document.createElement('div')
  caption.className = 'dice-caption'
  caption.textContent = `${roll.who} rolls ${rollName(roll.results.length, roll.sides)}`
  box.appendChild(caption)

  // Where they land: a loose cluster round the table's middle, one row of up
  // to six, spaced by the die's size.
  const size = Math.max(44, Math.min(84, window.innerWidth * 0.045))
  const perRow = Math.min(6, shown.length)
  const rows = Math.ceil(shown.length / perRow)
  const gap = size * 1.45
  const throwMs = roll.reduced ? 0 : roll.durationMs * THROW_SHARE
  const faces: { face: HTMLElement; result: number }[] = []

  shown.forEach((result, i) => {
    const row = Math.floor(i / perRow)
    const inRow = Math.min(perRow, shown.length - row * perRow)
    const col = i - row * perRow
    const landX = (col - (inRow - 1) / 2) * gap + (random() - 0.5) * size * 0.5
    const landY = (row - (rows - 1) / 2) * gap + (random() - 0.5) * size * 0.4
    const wrap = document.createElement('div')
    wrap.className = 'die-wrap'
    wrap.style.setProperty('--die-size', `${size}px`)
    wrap.style.left = `calc(50% + ${landX}px)`
    wrap.style.top = `calc(50% + ${landY}px)`
    const die = document.createElement('div')
    die.className = `die ${shapeOf(roll.sides)}`
    const face = document.createElement('span')
    face.className = 'die-face'
    face.textContent = String(roll.reduced ? result : 1 + Math.floor(random() * roll.sides))
    die.appendChild(face)
    wrap.appendChild(die)
    box.appendChild(wrap)
    faces.push({ face, result })

    if (roll.reduced) return
    // From the roller's side, a little spread, to the landing spot: three
    // hops, each lower than the last (scale stands in for height above the
    // table), tumbling all the way and squashing as it strikes.
    const startX = roll.from.x - landX + (random() - 0.5) * size * 3
    const startY = roll.from.y - landY + (random() - 0.5) * size * 2
    const spin = (random() < 0.5 ? -1 : 1) * (540 + random() * 540)
    const settle = (random() - 0.5) * 30
    const at = (t: number) => ({ x: startX * (1 - t), y: startY * (1 - t) })
    const p1 = at(0.55)
    const p2 = at(0.82)
    const p3 = at(0.95)
    const hop = (t: number) => `translate(${at(t).x}px, ${at(t).y - size * 0.35}px)`
    wrap.animate(
      [
        { offset: 0, transform: `translate(${startX}px, ${startY}px) scale(1.6)`, opacity: 0 },
        { offset: 0.08, opacity: 1 },
        { offset: FIRST_STRIKE, transform: `translate(${p1.x}px, ${p1.y}px) scale(1)`, easing: 'ease-out' },
        { offset: 0.5, transform: `${hop(0.7)} scale(1.25)`, easing: 'ease-in' },
        { offset: 0.64, transform: `translate(${p2.x}px, ${p2.y}px) scale(1)`, easing: 'ease-out' },
        { offset: 0.73, transform: `${hop(0.9)} scale(1.1)`, easing: 'ease-in' },
        { offset: 0.82, transform: `translate(${p3.x}px, ${p3.y}px) scale(1)`, easing: 'ease-out' },
        { offset: 1, transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
      ],
      { duration: throwMs, fill: 'both' },
    )
    die.animate(
      [
        { offset: 0, transform: `rotate(${spin}deg)` },
        { offset: FIRST_STRIKE, transform: `rotate(${spin * 0.45}deg) scale(1.12, 0.86)` },
        { offset: 0.42, transform: `rotate(${spin * 0.4}deg)` },
        { offset: 0.64, transform: `rotate(${spin * 0.15}deg) scale(1.08, 0.9)` },
        { offset: 0.68, transform: `rotate(${spin * 0.12}deg)` },
        { offset: 0.82, transform: `rotate(${settle + spin * 0.03}deg) scale(1.04, 0.96)` },
        { offset: 1, transform: `rotate(${settle}deg)` },
      ],
      { duration: throwMs, fill: 'both' },
    )
  })

  document.body.appendChild(box)

  const land = () => {
    for (const { face, result } of faces) face.textContent = String(result)
    box.classList.add('landed')
    const extra = roll.results.length > shown.length ? ` (+${roll.results.length - shown.length} more)` : ''
    caption.textContent =
      roll.results.length === 1
        ? `${roll.who} rolls ${rollName(1, roll.sides)}: ${total}`
        : `${roll.who} rolls ${rollName(roll.results.length, roll.sides)}: ${roll.results.join(', ')}${extra} — ${total}`
  }

  if (roll.reduced) {
    land()
  } else {
    // The faces tumble through numbers until the dice come to rest, then
    // show what was rolled.
    const tumble = window.setInterval(() => {
      for (const { face } of faces) face.textContent = String(1 + Math.floor(random() * roll.sides))
    }, 70)
    window.setTimeout(() => {
      window.clearInterval(tumble)
      land()
    }, throwMs * 0.84)
  }

  const fadeMs = roll.durationMs * FADE_SHARE
  window.setTimeout(() => {
    box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeMs, fill: 'forwards' })
    window.setTimeout(() => box.remove(), fadeMs)
  }, roll.durationMs - fadeMs)
}
