import type { PlayerId, PlayerView } from 'engine/client'

/** One player's game, as the end-of-game panel tallies it. */
export interface PlayerStats {
  readonly player: PlayerId
  /** Their life when the game ended (or when they left it). */
  readonly life: number
  /** Damage dealt to other players by sources they controlled. */
  readonly damageDealt: number
  /** Damage dealt to them, by anyone's sources. */
  readonly damageTaken: number
  readonly lifeGained: number
  readonly spellsCast: number
  /** Cards drawn once the game was under way: not the opening hand, nor a
   * mulligan's redraw. */
  readonly cardsDrawn: number
  /** The turn they lost on, its round (absent from a log before rounds were
   * kept), and why ("conceded", "life total is 0 or less"); null for a
   * player still in at the end. */
  readonly out: { readonly turn: number; readonly round?: number; readonly reason: string } | null
}

export interface GameStats {
  /** How many turns were taken. */
  readonly turns: number
  /** The round the game ended in (`TurnState.round`), absent from a log
   * before rounds were kept. */
  readonly rounds?: number
  /** Every player: the winner first, then whoever lasted longest. */
  readonly players: readonly PlayerStats[]
}

/**
 * The game's numbers, worked out of the view's event log (`view.events`,
 * every seat's whole log). Damage is credited by the event's `by` — who
 * controlled the source as it dealt it, which a dead creature's own trigger
 * still knows — rather than by looking the source up, since a token that
 * died is gone from the view.
 */
export function gameStats(view: PlayerView): GameStats {
  const tally = new Map<PlayerId, { dealt: number; taken: number; gained: number; cast: number; drawn: number }>()
  for (const pid of view.turnOrder) tally.set(pid, { dealt: 0, taken: 0, gained: 0, cast: 0, drawn: 0 })
  const out = new Map<PlayerId, { turn: number; round: number | undefined; reason: string; seq: number }>()
  let turn = 0
  let round: number | undefined
  for (const ev of view.events) {
    if (ev.type === 'turn-began') {
      turn = ev.turn
      round = ev.round
    } else if (ev.type === 'damage-dealt' && ev.target.kind === 'player') {
      const taken = tally.get(ev.target.player)
      if (taken) taken.taken += ev.amount
      if (ev.by !== undefined && ev.by !== ev.target.player) {
        const dealt = tally.get(ev.by)
        if (dealt) dealt.dealt += ev.amount
      }
    } else if (ev.type === 'life-changed' && ev.delta > 0) {
      const t = tally.get(ev.player)
      if (t) t.gained += ev.delta
    } else if (ev.type === 'spell-cast') {
      const t = tally.get(ev.player)
      if (t) t.cast += 1
    } else if (ev.type === 'card-drawn' && turn > 0) {
      const t = tally.get(ev.player)
      if (t) t.drawn += 1
    } else if (ev.type === 'player-lost' && !out.has(ev.player)) {
      out.set(ev.player, { turn, round, reason: ev.reason, seq: ev.seq })
    }
  }
  const winner = view.result.winner
  const players: PlayerStats[] = view.turnOrder.map((player) => {
    const t = tally.get(player)!
    const lost = out.get(player)
    return {
      player,
      life: view.players[player]?.life ?? 0,
      damageDealt: t.dealt,
      damageTaken: t.taken,
      lifeGained: t.gained,
      spellsCast: t.cast,
      cardsDrawn: t.drawn,
      out:
        lost === undefined
          ? null
          : { turn: lost.turn, ...(lost.round !== undefined ? { round: lost.round } : {}), reason: lost.reason },
    }
  })
  const rank = (p: PlayerStats): [number, number] => {
    if (p.player === winner) return [0, 0]
    const lost = out.get(p.player)
    // Still in at the end (a draw), by life; then the last out first.
    return lost === undefined ? [1, -p.life] : [2, -lost.seq]
  }
  players.sort((a, b) => {
    const [ra, sa] = rank(a)
    const [rb, sb] = rank(b)
    return ra - rb || sa - sb
  })
  return { turns: turn, ...(round !== undefined ? { rounds: round } : {}), players }
}
