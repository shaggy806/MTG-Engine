/**
 * Combat arithmetic for the bot: how much damage an attack is *guaranteed* to
 * deal against the best blocks available, and so whether it's lethal.
 *
 * Two questions the one-ply evaluation can't answer on its own, because both
 * are about a turn that hasn't happened yet — *can I win right now by swinging
 * with everything*, and *if I swing, do I die on the way back* ("crackback").
 * Engine rollouts could answer them, but only at the cost of simulating a
 * whole opponent turn per candidate attack, so this is plain arithmetic over
 * computed characteristics instead. See "Combat: the alpha strike and
 * crackback" in `docs/plans/smarter-bots.md`.
 *
 * Blocking legality mirrors `Game.whyCannotBlock`: tapped, "can't block",
 * unblockable, protection, fear, intimidate, flying/reach, and menace's two
 * blockers. What it deliberately ignores — instant-speed tricks, haste
 * creatures still in hand, removal on blockers — is covered by a flat life
 * margin instead (`EvalWeights.crackbackMargin`).
 */

import type { CardType, Keyword } from "../cards/define.js";
import type { Color } from "../mana.js";
import { combatDamageOf, computeCharacteristics } from "../characteristics.js";
import { LANDWALK, landTypesControlledBy } from "../combat/eligibility.js";
import type { CardRegistry } from "../cards.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { COMMANDER_DAMAGE_LETHAL } from "../view.js";

/** A creature as combat arithmetic sees it. */
export interface CombatCreature {
  readonly id: ObjectId;
  readonly power: number;
  readonly toughness: number;
  /** The combat damage it assigns (`combatDamageOf`): its power, or its
   * toughness under Doran, the Siege Tower and the like. What every
   * question here about damage dealt reads; `power` stays the real power,
   * for valuing the creature. */
  readonly damage: number;
  readonly keywords: ReadonlySet<Keyword>;
  readonly colors: ReadonlySet<Color>;
  readonly types: readonly CardType[];
  readonly protectionColors: ReadonlySet<Color>;
  readonly protectionTypes: ReadonlySet<CardType>;
  readonly canBlock: boolean;
  readonly canAttack: boolean;
  readonly isCommander: boolean;
  /** Land types its controller controls, which a landwalker attacking them
   * can't be blocked past (rule 702.14). */
  readonly controllerLands: ReadonlySet<string>;
}

/** A token stack is expanded to at most this many copies — enough for any
 * blocking question, and bounded however large the stack grows. */
const MAX_COPIES = 30;

/**
 * Every creature `player` controls on the battlefield. `untappedOnly` is what a
 * blocker needs; an attacker on a future turn will have untapped anyway.
 */
export function combatCreatures(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  untappedOnly: boolean,
): CombatCreature[] {
  const out: CombatCreature[] = [];
  const controllerLands = landTypesControlledBy(state, registry, player);
  for (const id of state.zones.shared.battlefield) {
    const object = state.objects[id];
    if (object === undefined || object.controller !== player) continue;
    if (untappedOnly && object.tapped) continue;
    const c = computeCharacteristics(state, registry, id);
    if (!c.types.includes("creature")) continue;
    const creature: CombatCreature = {
      id,
      power: c.power,
      toughness: c.toughness,
      damage: combatDamageOf(c),
      keywords: c.keywords,
      colors: c.colors,
      types: c.types,
      protectionColors: c.protectionFrom.colors,
      protectionTypes: c.protectionFrom.types,
      canBlock: !object.tapped && !c.restrictions.has("cant-block"),
      canAttack:
        (!c.keywords.has("defender") || c.canAttackAsThoughNoDefender) &&
        !c.restrictions.has("cant-attack") &&
        combatDamageOf(c) > 0,
      isCommander: object.isCommander,
      controllerLands,
    };
    const copies = Math.min(object.stackCount ?? 1, MAX_COPIES);
    for (let i = 0; i < copies; i += 1) out.push(creature);
  }
  return out;
}

/** Can `blocker` legally block `attacker`, menace aside? */
export function canBlock(blocker: CombatCreature, attacker: CombatCreature): boolean {
  if (!blocker.canBlock) return false;
  const a = attacker.keywords;
  if (a.has("unblockable")) return false;
  for (const color of blocker.colors) if (attacker.protectionColors.has(color)) return false;
  for (const type of blocker.types) if (attacker.protectionTypes.has(type)) return false;
  const artifact = blocker.types.includes("artifact");
  if (a.has("fear") && !artifact && !blocker.colors.has("B")) return false;
  if (a.has("intimidate") && !artifact) {
    let shares = false;
    for (const color of attacker.colors) if (blocker.colors.has(color)) shares = true;
    if (!shares) return false;
  }
  if (a.has("flying") && !blocker.keywords.has("flying") && !blocker.keywords.has("reach")) {
    return false;
  }
  for (const [keyword, landType] of LANDWALK) {
    if (a.has(keyword) && blocker.controllerLands.has(landType)) return false;
  }
  return true;
}

/** Damage an attacker deals if nothing blocks it. */
const unblockedDamage = (attacker: CombatCreature): number =>
  Math.max(0, attacker.damage) * (attacker.keywords.has("double-strike") ? 2 : 1);

export interface DamageThrough {
  /** Total damage to the defending player. */
  readonly damage: number;
  /** Of that, how much each commander dealt. */
  readonly commanderDamage: ReadonlyMap<ObjectId, number>;
}

/**
 * The least damage `attackers` are guaranteed to deal to a player defending
 * with `blockers`, who blocks to take as little as possible.
 *
 * Greedy rather than an exact assignment: the attackers that would deal the
 * most are blocked first (ties to the one with fewer legal blockers), and each
 * takes the blocker useful against the fewest other attackers — so a reach
 * creature is saved for a flyer when a ground blocker would do. A trampler
 * takes the one with the most toughness instead, since only toughness holds it
 * back. Menace needs two. Close to exact at the board sizes that come up.
 */
export function damageThrough(
  attackers: readonly CombatCreature[],
  blockers: readonly CombatCreature[],
): DamageThrough {
  const free = new Set(blockers.map((_, i) => i));
  const legal = attackers.map((attacker) =>
    blockers.map((blocker, i) => (canBlock(blocker, attacker) ? i : -1)).filter((i) => i >= 0),
  );
  const order = attackers
    .map((_, i) => i)
    .sort(
      (x, y) =>
        unblockedDamage(attackers[y]) - unblockedDamage(attackers[x]) ||
        legal[x].length - legal[y].length,
    );
  const usefulness = (b: number): number => legal.filter((l) => l.includes(b)).length;

  let damage = 0;
  const commanderDamage = new Map<ObjectId, number>();
  for (const index of order) {
    const attacker = attackers[index];
    const full = unblockedDamage(attacker);
    if (full === 0) continue;
    const trample = attacker.keywords.has("trample");
    const needed = attacker.keywords.has("menace") ? 2 : 1;
    const available = legal[index]
      .filter((b) => free.has(b))
      .sort((x, y) =>
        trample
          ? blockers[y].toughness - blockers[x].toughness
          : usefulness(x) - usefulness(y) || blockers[x].toughness - blockers[y].toughness,
      );

    let through = full;
    if (available.length >= needed) {
      const chosen = available.slice(0, needed);
      // Blocking only stops a trampler's damage up to the blockers' toughness.
      const absorbed = chosen.reduce((sum, b) => sum + Math.max(0, blockers[b].toughness), 0);
      const excess = trample ? Math.max(0, full - absorbed) : 0;
      // Worth spending the blockers only if they actually stop something.
      if (full - excess > 0) {
        for (const b of chosen) free.delete(b);
        through = excess;
      }
    }
    damage += through;
    if (attacker.isCommander && through > 0) {
      commanderDamage.set(attacker.id, (commanderDamage.get(attacker.id) ?? 0) + through);
    }
  }
  return { damage, commanderDamage };
}

/**
 * Does `through` kill `defender` — on life, or on 21 damage from any one
 * commander counting what they've already taken? `margin` is life the
 * defender is assumed to find from somewhere (a trick, a blocker from hand).
 */
export function isLethal(
  state: GameState,
  defender: PlayerId,
  through: DamageThrough,
  margin = 0,
): boolean {
  const p = state.players[defender];
  if (p === undefined || p.hasLost) return false;
  if (through.damage >= p.life + margin) return true;
  for (const [commander, amount] of through.commanderDamage) {
    if ((p.commanderDamageTaken[commander] ?? 0) + amount >= COMMANDER_DAMAGE_LETHAL) return true;
  }
  return false;
}

/**
 * Crackback: before `me` untaps again, every living opponent gets a turn. If
 * each swings every creature able to attack into the blockers `me` has
 * untapped right now, how much gets through?
 *
 * Blockers are reused across opponents — blocking doesn't tap — and each
 * opponent's damage is weighted by `paranoia`, except the one whose turn is
 * next, which always counts in full: at a four-player table the others have
 * each other to attack as well. Commander damage is summed per commander.
 */
export function crackback(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  paranoia: number,
): DamageThrough {
  const blockers = combatCreatures(state, registry, me, true);
  const order = state.turnOrder.filter((p) => !state.players[p].hasLost);
  const mine = order.indexOf(me);
  const opponents = [...order.slice(mine + 1), ...order.slice(0, Math.max(0, mine))];

  let damage = 0;
  const commanderDamage = new Map<ObjectId, number>();
  opponents.forEach((opponent, i) => {
    const weight = i === 0 ? 1 : Math.max(0, Math.min(1, paranoia));
    if (weight === 0) return;
    const attackers = combatCreatures(state, registry, opponent, false).filter((c) => c.canAttack);
    const through = damageThrough(attackers, blockers);
    damage += through.damage * weight;
    for (const [commander, amount] of through.commanderDamage) {
      commanderDamage.set(commander, (commanderDamage.get(commander) ?? 0) + amount * weight);
    }
  });
  return { damage, commanderDamage };
}
