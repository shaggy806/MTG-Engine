/**
 * Which side of the table a target belongs on — what a bot needs to know
 * before it can aim anything.
 *
 * Every other MTG AI has this layer and ours didn't. Forge's AI is ~150
 * per-effect classes, each deciding whom its effect should hit; our bots took
 * the first legal target (v1) or simulated the first eight combinations in
 * that same order (v2). `legalTargets` lists the players in turn order and
 * then the battlefield oldest-first, so "first" was the bot itself or its own
 * oldest permanent: v1 pacified its own creatures, Murdered its own Bears and
 * countered its own spells, and on a four-player board v2 never saw a threat
 * newer than the turn-one lands. See `docs/plans/bot-effect-knowledge.md`.
 *
 * A target slot is **harm** (bad for whoever controls the target — aim it at
 * an opponent), **help** (aim it at your own), **take** (good for you
 * whoever's it is — reanimating onto your side, copying a spell) or
 * **either** (the board decides — a blink, a transform, anything the
 * vocabulary can't read). It is derived from the declarative effect tree, so
 * it covers every card without a list of cards, through a rule per effect kind
 * that is total over `EffectSpec["kind"]`: a new kind fails the build here
 * until someone says which side of the table it belongs on.
 *
 * The strongest effect on a slot decides it. Removal and theft are decisive —
 * whatever rides along with them is a consolation to the victim (Swords to
 * Plowshares' life, Generous Gift's Elephant) — and a major effect outranks a
 * minor one (Sign in Blood's two cards outrank its two life). Effects of one
 * strength that disagree leave the slot to the board: `either`.
 *
 * Pure over card definitions and a `GameState`, with no `bot/` import, so the
 * decision modules may use it too.
 */

import type { ActivatedAbility, TriggeredAbility } from "./abilities.js";
import type { LegalAction } from "./actions.js";
import type { CardRegistry } from "./cards.js";
import type { CardDefinition } from "./cards/define.js";
import { computeCharacteristics } from "./characteristics.js";
import type { EffectAmount, EffectSpec } from "./effects.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";
import { printedCardName } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

export type Polarity = "harm" | "help" | "take" | "either";

/**
 * A deck's own reading of some effect kinds, overriding the table below for
 * every slot those kinds touch — a self-mill deck's `mill: "help"`. The
 * table says which side an effect belongs on for a deck with no plan for it;
 * `deck-bias.ts` holds the decks that have one.
 */
export type PolarityBias = Readonly<Partial<Record<EffectSpec["kind"], Polarity>>>;

/** How much one effect says about a slot — see the module comment. */
const MINOR = 0;
const MAJOR = 1;
const DECISIVE = 2;

interface Touch {
  readonly polarity: Polarity;
  readonly weight: number;
}

interface Visit {
  /** This effect does `polarity` to whatever `ref` names, if it names a
   * target slot. */
  touch(ref: unknown, polarity: Polarity, weight: number): void;
  /** An effect nested inside this one that reads the same target slots. */
  child(effect: EffectSpec | null | undefined): void;
}

type Kind = EffectSpec["kind"];
type Of<K extends Kind> = Extract<EffectSpec, { readonly kind: K }>;
type Rule<K extends Kind> = (node: Of<K>, visit: Visit) => void;

/** Touches no target slot, and holds no effect that does. */
const none = (): void => {};

/** Counters that are bad to have. Everything else a targeted `add-counter`
 * puts in the pool is `+1/+1`, loyalty, a keyword counter or a resource. */
const HARMFUL_COUNTERS: ReadonlySet<string> = new Set(["-1/-1", "blight", "flood", "stun"]);

/** The sign of an amount: a live count is never negative unless it is scaled
 * by a negative `times`. */
function amountSign(amount: EffectAmount): number {
  if (typeof amount === "number") return Math.sign(amount);
  if (typeof amount === "object" && amount !== null && "times" in amount) {
    const times = (amount as { readonly times?: number }).times;
    if (typeof times === "number" && times < 0) return -1;
  }
  return 1;
}

/**
 * One rule per effect kind: which target slots it touches and how, and which
 * nested effects share its targets.
 *
 * Nested effects that **rebind** target 0 are deliberately not visited:
 * `look-and-choose`, `reveal-top`, `reveal-until` and `choose-permanents`
 * apply `then` to what they found or chose as target 0, a `reflexive-trigger`
 * chooses targets of its own, and a granted ability is a different ability
 * altogether. Reading their slots as the enclosing ability's would aim the
 * wrong way.
 */
const RULES: { readonly [K in Kind]: Rule<K> } = {
  sequence: (n, v) => n.effects.forEach((e) => v.child(e)),
  "for-each-target": (n, v) => v.child(n.effect),
  "for-each-player": (n, v) => v.child(n.effect),
  "for-target": (n, v) => v.child(n.effect),
  // Their slot 0 is a convoking creature, not the spell's target 0.
  "for-each-convoker": none,
  "for-convoker": none,
  "choose-opponent": (n, v) => v.child(n.then),
  "about-player": (n, v) => v.child(n.effect),
  "choose-permanents": none,
  damage: (n, v) => {
    v.touch(n.target, "harm", MAJOR);
    v.touch(n.toControllerOfTarget, "harm", MINOR);
    // "Target creature you control deals damage" — the dealer is yours.
    v.touch(n.from, "help", MINOR);
  },
  "damage-divided-evenly": (n, v) => v.touch(n.from, "harm", MAJOR),
  "add-mana": none,
  draw: (n, v) => v.touch(n.target, "help", MAJOR),
  "discard-hand": none,
  "gain-life": (n, v) => v.touch(n.toControllerOfTarget, "help", MINOR),
  "lose-life": (n, v) => {
    v.touch(n.target, "harm", MINOR);
    v.touch(n.toControllerOfTarget, "harm", MINOR);
  },
  tap: (n, v) => v.touch(n.target, "harm", MINOR),
  untap: (n, v) => v.touch(n.target, "help", MINOR),
  destroy: (n, v) => v.touch(n.target, "harm", DECISIVE),
  "put-on-bottom-of-library": (n, v) => v.touch(n.target, "harm", DECISIVE),
  "shuffle-into-library": (n, v) => v.touch(n.target, "harm", DECISIVE),
  "destroy-all": none,
  regenerate: (n, v) => v.touch(n.target, "help", MINOR),
  "regenerate-all": none,
  "damage-all": (n, v) => v.touch(n.from, "help", MINOR),
  "creatures-damage-controllers": none,
  // An edict: the targeted player picks what goes, so it is major rather
  // than decisive — nothing in particular is removed.
  sacrifice: (n, v) => v.touch(n.who === "target" ? 0 : undefined, "harm", MAJOR),
  "sacrifice-target": (n, v) => v.touch(n.target, "harm", DECISIVE),
  "sacrifice-source": (n, v) => v.child(n.then),
  // "Target creature you control fights target creature you don't control":
  // the fighter is the best creature you have, the victim theirs.
  fight: (n, v) => {
    v.touch(n.a, "help", MINOR);
    v.touch(n.b, "harm", MAJOR);
  },
  "return-to-hand": (n, v) => {
    const from = n.from ?? "battlefield";
    // A bounce or a spell sent back is removal; a card back from a
    // graveyard or exile is recursion for its owner.
    if (from === "battlefield" || from === "stack") v.touch(n.target, "harm", DECISIVE);
    else v.touch(n.target, "help", MAJOR);
  },
  "return-to-hand-all": none,
  "exile-all": none,
  exile: (n, v) => v.touch(n.target, "harm", DECISIVE),
  "choose-creature-type": (n, v) => v.child(n.then),
  "return-exiled-by-source": none,
  "put-onto-battlefield": (n, v) => {
    if (n.underYourControl === true) v.touch(n.target, "take", MAJOR);
    else if (n.under !== undefined && n.under !== "you") v.touch(n.target, "either", MAJOR);
    else v.touch(n.target, "help", MAJOR);
    if (n.under !== undefined && typeof n.under === "object") v.touch(n.under, "help", MINOR);
  },
  "exile-graveyard": (n, v) => v.touch(n.target, "harm", MINOR),
  flicker: (n, v) => v.touch(n.target, "help", MINOR),
  "return-flickered": none,
  counter: (n, v) => v.touch(n.target, "harm", DECISIVE),
  "gain-control": (n, v) => {
    v.touch(n.target, "harm", DECISIVE);
    // "Target opponent gains control of target permanent you control"
    // (Zedruu): the player slot is the one getting something.
    if (n.who !== undefined && typeof n.who === "object") v.touch(n.who, "help", MINOR);
  },
  "gain-control-all": none,
  "rotate-control": none,
  "cant-be-sacrificed": (n, v) => v.touch(n.target, "help", MINOR),
  "attack-despite-defender": (n, v) => {
    if (n.target !== undefined) v.touch(n.target, "help", MINOR);
  },
  "damage-by-toughness": (n, v) => v.touch(n.target, "help", MINOR),
  "attack-random-opponent": (n, v) => {
    v.touch(n.target, "either", MINOR);
    v.child(n.else);
  },
  // A commander a delayed trigger takes home (Hellkite Courser): the
  // controller's own, sent back as the card says, never a choice to weigh.
  "put-in-command-zone": (n, v) => v.touch(n.target, "either", MINOR),
  // Its own source in print (Tree of Redemption); which way it cuts turns
  // on the numbers, not the side of the table.
  "exchange-life-toughness": (n, v) => {
    v.touch(n.target, "either", MINOR);
    // Tree of Perdition's target opponent: a life total of 13 is a cut
    // from 40 and a gift at 5.
    if (n.player !== undefined && typeof n.player === "object") v.touch(n.player, "either", MAJOR);
  },
  mill: (n, v) => v.touch(n.target, "harm", MINOR),
  "exile-from-library": (n, v) => v.touch(n.whose, "harm", MINOR),
  "return-from-graveyard": none,
  // A delayed ability acts on the targets its creator chose (rule 603.7d).
  "delayed-trigger": (n, v) => v.child(n.effect),
  "enters-with-counters": (n, v) => v.touch(n.target, "help", MINOR),
  "allow-cast-from-exile": (n, v) => v.touch(n.target, "take", MAJOR),
  "cast-now": (n, v) => {
    v.touch(n.from === "targets" ? EVERY_SLOT : n.target, "take", MAJOR);
    v.child(n.then);
    v.child(n.else);
  },
  earthbend: (n, v) => v.touch(n.target, "help", MAJOR),
  "reflexive-trigger": none,
  "put-on-library": (n, v) => v.touch(n.target, "help", MINOR),
  discard: (n, v) => v.touch(n.target, "harm", MAJOR),
  "modify-pt": (n, v) => {
    const power = amountSign(n.power);
    const toughness = amountSign(n.toughness);
    if (toughness < 0) v.touch(n.target, "harm", MAJOR);
    else if (power < 0) v.touch(n.target, "harm", MINOR);
    else if (power > 0 || toughness > 0) v.touch(n.target, "help", MAJOR);
  },
  "modify-pt-all": (n, v) => {
    const shrinks = amountSign(n.toughness) < 0 || amountSign(n.power) < 0;
    v.touch(n.controlledByTarget, shrinks ? "harm" : "help", MINOR);
  },
  "double-pt-all": none,
  "double-counters-all": none,
  "double-counters": (n, v) => v.touch(n.target, "help", MAJOR),
  "grant-keyword-all": none,
  "add-counter": (n, v) =>
    v.touch(n.target, HARMFUL_COUNTERS.has(n.counter) ? "harm" : "help", MAJOR),
  "add-counter-all": none,
  // The reverse of `add-counter`: losing a harmful counter helps.
  "remove-counter": (n, v) =>
    v.touch(n.target, HARMFUL_COUNTERS.has(n.counter) ? "help" : "harm", MAJOR),
  // Card selection and maybe a counter, for the conniving permanent's side.
  connive: (n, v) => v.touch(n.target, "help", MAJOR),
  "grant-player-hexproof": none,
  "grant-spells-this-turn": none,
  populate: none,
  amass: none,
  monstrosity: none,
  // It won't untap: a cost when it's your own, a drawback on someone else's.
  exert: (n, v) => v.touch(n.target, "harm", MINOR),
  proliferate: (n, v) => v.child(n.then),
  "grant-keyword": (n, v) =>
    n.keyword === "defender"
      ? v.touch(n.target, "harm", MINOR)
      : v.touch(n.target, "help", MAJOR),
  "player-effect": none,
  // "You win" has no target; "target opponent loses the game" harms it.
  "win-game": none,
  "lose-game": (n, v) => v.touch(n.target, "harm", MAJOR),
  "flip-coin": (n, v) => {
    v.child(n.won);
    v.child(n.lost);
  },
  prohibit: (n, v) => {
    v.touch(n.target, "harm", MINOR);
    v.touch(n.who, "harm", MINOR);
  },
  restrict: (n, v) => {
    const lure = (r: string): boolean => r === "must-be-blocked" || r === "must-be-blocked-if-able";
    const helps = n.restrictions.some(lure);
    const hurts = n.restrictions.some((r) => !lure(r));
    v.touch(n.target, helps && hurts ? "either" : helps ? "help" : "harm", MINOR);
  },
  "grant-flashback": (n, v) => v.touch(n.target, "help", MAJOR),
  "grant-flashback-all": none,
  "grant-graveyard-cast": (n, v) => v.touch(n.target, "help", MAJOR),
  "grant-triggered": (n, v) => v.touch(n.target, "help", MAJOR),
  "lose-abilities": (n, v) => v.touch(n.target, "harm", MAJOR),
  "lose-abilities-all": none,
  gift: none,
  "grant-activated": (n, v) => v.touch(n.target, "help", MAJOR),
  "grant-activated-all": none,
  "grant-triggered-all": none,
  "take-extra-turn": (n, v) => v.touch(n.target, "help", MAJOR),
  storm: none,
  cascade: none,
  // Its `then` sees the card found as target 0, not the enclosing slot 0.
  "reveal-until": (n, v) => v.touch(n.whose, "harm", MINOR),
  // The copy is yours whoever cast the original. A copy aimed at a target
  // slot (Zada's order) aims it at your own permanent.
  "copy-spell": (n, v) => {
    v.touch(n.target, "take", MAJOR);
    if (typeof n.retargetTo === "number") v.touch(n.retargetTo, "help", MAJOR);
  },
  // An ability you'd want twice is yours: every card copying one says "you
  // control".
  "copy-ability": (n, v) => v.touch(n.target, "help", MAJOR),
  "exile-spell-as-it-resolves": none,
  "additional-combat": none,
  "additional-upkeep-steps": none,
  "additional-land-drop": none,
  "shuffle-library": none,
  "damage-divided": none,
  "untap-all": (n, v) => v.touch(n.controlledByTarget, "help", MINOR),
  "tap-all": none,
  // Turn to Frog is removal; animating a land is a man-land. Only the first
  // says which.
  animate: (n, v) => v.touch(n.target, n.loseAbilities === true ? "harm" : "either", MAJOR),
  "add-types": (n, v) => v.touch(n.target, "either", MINOR),
  "animate-all": none,
  "change-text": (n, v) => v.touch(n.target, "either", MINOR),
  // "Its controller creates a 3/3 Beast" rides on the removal it follows.
  "create-token": (n, v) => v.touch(n.who === "target-controller" ? 0 : undefined, "help", MINOR),
  // A copy goes to the copied permanent's controller unless the card says
  // it's yours (Hate Mirage).
  "create-token-copy": (n, v) => v.touch(n.of, n.who === "you" ? "take" : "help", MAJOR),
  attach: (n, v) => v.touch(n.target, "help", MINOR),
  transform: (n, v) => v.touch(n.target, "either", MINOR),
  "become-copy": (n, v) => v.touch(n.target, "either", MINOR),
  "day-night": none,
  "become-monarch": none,
  "add-player-counters": (n, v) =>
    n.counter === "poison" ? v.touch(n.target, "harm", MAJOR) : v.touch(n.target, "help", MINOR),
  "get-energy": none,
  "create-emblem": none,
  "prevent-all-combat-damage": none,
  "prevent-damage": (n, v) => v.touch(n.target, "help", MINOR),
  // An announced modal ability's modes bring targets of their own, known
  // only once chosen — see `pendingTargetPolarities`.
  modal: (n, v) => {
    if (n.announced === true) return;
    n.modes.forEach((mode) => v.child(mode.effect));
  },
  conditional: (n, v) => {
    v.child(n.then);
    v.child(n.else);
  },
  may: (n, v) => {
    v.child(n.effect);
    v.child(n.then);
    v.child(n.else);
  },
  // A punisher: whoever chooses pays or suffers.
  unless: (n, v) => {
    v.touch(typeof n.chooser === "number" ? n.chooser : undefined, "harm", MINOR);
    v.child(n.otherwise);
  },
  "each-player-may": (n, v) => {
    v.child(n.effect);
    v.child(n.ifDid);
    v.child(n.ifDidnt);
    (n.choices ?? []).forEach((choice) => v.child(choice.effect));
  },
  ward: none,
  "sacrifice-all-but": none,
  "sacrifice-all": none,
  "choose-exiled-to-play": none,
  "put-exiled-this-way-onto-battlefield": none,
  "put-arrived-onto-battlefield": none,
  "reveal-until-count": none,
  encore: none,
  goad: (n, v) => v.touch(n.target, "harm", MINOR),
  // Menace and can't block: a drawback on a blocker, a boon on an attacker.
  suspect: (n, v) => v.touch(n.target, "either", MINOR),
  unsuspect: (n, v) => v.touch(n.target, "either", MINOR),
  "attack-requirement": none,
  "impulse-exile": none,
  scry: (n, v) => v.child(n.then),
  "reveal-top": none,
  surveil: (n, v) => v.child(n.then),
  // "Its controller may search their library for a basic land" (Path to
  // Exile) — a consolation, like the life of Swords to Plowshares.
  "search-library": (n, v) => v.touch(n.who?.controllerOfTarget, "help", MINOR),
  // Choosing among its own targets (Sepulchral Primordial's cards from
  // opponents' graveyards, put onto the battlefield under your control).
  "look-and-choose": (n, v) => {
    if (n.zone === "targets") v.touch(EVERY_SLOT, "take", MAJOR);
  },
};

/** Every target slot an effect over "its targets" can name — more than any
 * card has. */
const EVERY_SLOT: readonly number[] = Array.from({ length: 8 }, (_, i) => i);

/** The target slots `ref` names: a slot index, several, an "any number of"
 * group's first slot, a player slot (`{ target }`), or an edict's
 * `"target"`, which is its one player slot. */
function slotsOf(ref: unknown): readonly number[] {
  if (typeof ref === "number") return [ref];
  if (Array.isArray(ref)) return ref.filter((x): x is number => typeof x === "number");
  if (typeof ref === "object" && ref !== null) {
    const slot = (ref as { readonly from?: unknown; readonly target?: unknown }).from ??
      (ref as { readonly target?: unknown }).target;
    return typeof slot === "number" ? [slot] : [];
  }
  return [];
}

function resolveSlot(touches: readonly Touch[]): Polarity {
  if (touches.length === 0) return "either";
  const top = Math.max(...touches.map((t) => t.weight));
  const agreed = new Set(touches.filter((t) => t.weight === top).map((t) => t.polarity));
  return agreed.size === 1 ? [...agreed][0] : "either";
}

/**
 * The polarity of each of `count` target slots of `effect`, by slot index.
 * A slot no effect touches is `either`.
 */
export function slotPolarities(
  effect: EffectSpec | null | undefined,
  count: number,
  bias?: PolarityBias,
): readonly Polarity[] {
  return slotTouches(effect, count, bias).map(resolveSlot);
}

/** How much a slot's deciding effect weighs: 0 minor (a tap, two life), 1
 * major (a card, a pump), 2 decisive (removal, theft). */
export type SlotStrength = 0 | 1 | 2;

/**
 * Each slot's polarity with the weight of the effects that decided it, or
 * `null` for a slot no effect touches — what `effect-worth.ts` needs to say
 * how much a target on the wrong side costs, not just which side it is.
 */
export function slotStrengths(
  effect: EffectSpec | null | undefined,
  count: number,
  bias?: PolarityBias,
): readonly ({ readonly polarity: Polarity; readonly weight: SlotStrength } | null)[] {
  return slotTouches(effect, count, bias).map((touches) =>
    touches.length === 0
      ? null
      : {
          polarity: resolveSlot(touches),
          weight: Math.max(...touches.map((t) => t.weight)) as SlotStrength,
        },
  );
}

function slotTouches(
  effect: EffectSpec | null | undefined,
  count: number,
  bias?: PolarityBias,
): Touch[][] {
  const touches: Touch[][] = Array.from({ length: count }, () => []);
  // The kind whose rule is touching right now, for `bias`. A child's walk
  // sets its own and puts this one back.
  let kind: Kind | null = null;
  const visit: Visit = {
    touch(ref, polarity, weight) {
      const side = (kind !== null ? bias?.[kind] : undefined) ?? polarity;
      for (const slot of slotsOf(ref)) {
        if (slot >= 0 && slot < count) touches[slot].push({ polarity: side, weight });
      }
    },
    child(nested) {
      if (nested !== null && nested !== undefined) walk(nested);
    },
  };
  const walk = (node: EffectSpec): void => {
    const outer = kind;
    kind = node.kind;
    (RULES[node.kind] as (n: EffectSpec, v: Visit) => void)(node, visit);
    kind = outer;
  };
  if (effect !== null && effect !== undefined && count > 0) walk(effect);
  return touches;
}

/**
 * What an Aura does to the permanent (or player) it enchants — slot 0 of
 * casting it. Read off its `attached` statics: a combat restriction, a
 * shrink, a lost untap step or "defender" hurts; a pump, a keyword or a
 * granted ability helps. A Curse enchants the player it punishes, and an Aura
 * that steals what it enchants (Mind Control) is theft.
 */
export function auraPolarity(def: CardDefinition): Polarity {
  if (def.controlEnchanted) return "harm";
  if ((def.subtypes ?? []).includes("Curse")) return "harm";
  let harm = false;
  let help = false;
  for (const ability of def.static ?? []) {
    if (ability.affects.scope !== "attached") continue;
    for (const restriction of ability.restrictions ?? []) {
      if (restriction === "must-be-blocked" || restriction === "must-be-blocked-if-able") help = true;
      else harm = true;
    }
    if (ability.grantPt !== undefined) {
      const sum = ability.grantPt[0] + ability.grantPt[1];
      if (sum < 0) harm = true;
      else if (sum > 0) help = true;
    }
    for (const keyword of ability.grantKeywords ?? []) {
      if (keyword === "defender") harm = true;
      else help = true;
    }
    if ((ability.grantsActivated ?? []).length > 0) help = true;
    if ((ability.grantsTriggered ?? []).length > 0) help = true;
    if (ability.grantPtPerCount !== undefined) help = true;
    if (ability.protection !== undefined || ability.cantBeSacrificed === true) help = true;
    if (ability.doesntUntap === true || ability.cantAttackController === true) harm = true;
    if (ability.goads === true || ability.prohibits !== undefined) harm = true;
  }
  return harm === help ? "either" : harm ? "harm" : "help";
}

/** Memos for one bias (or none): every definition reads the same under it,
 * and the biases are a fixed table, so there are only ever a handful. */
interface Memos {
  readonly cast: WeakMap<CardDefinition, readonly Polarity[]>;
  readonly ability: WeakMap<object, readonly Polarity[]>;
  readonly mode: WeakMap<object, readonly Polarity[]>;
}

const UNBIASED: PolarityBias = {};
const memosByBias = new WeakMap<PolarityBias, Memos>();

function memosFor(bias: PolarityBias = UNBIASED): Memos {
  let memos = memosByBias.get(bias);
  if (memos === undefined) {
    memos = { cast: new WeakMap(), ability: new WeakMap(), mode: new WeakMap() };
    memosByBias.set(bias, memos);
  }
  return memos;
}

/** The polarity of each target slot of casting `def` — an Aura's slot 0
 * from its statics, the rest from its effect. */
export function castPolarities(def: CardDefinition, bias?: PolarityBias): readonly Polarity[] {
  const memo = memosFor(bias).cast;
  let found = memo.get(def);
  if (found === undefined) {
    const slots = slotPolarities(def.effect, def.targets.length, bias);
    found = (def.subtypes ?? []).includes("Aura") && slots.length > 0
      ? [auraPolarity(def), ...slots.slice(1)]
      : slots;
    memo.set(def, found);
  }
  return found;
}

/** The polarity of each target slot of an activated or triggered ability. */
export function abilityPolarities(
  ability: Pick<ActivatedAbility | TriggeredAbility, "targets" | "effect">,
  bias?: PolarityBias,
): readonly Polarity[] {
  const memo = memosFor(bias).ability;
  let found = memo.get(ability);
  if (found === undefined) {
    found = slotPolarities(ability.effect, ability.targets.length, bias);
    memo.set(ability, found);
  }
  return found;
}

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;
type ActivateOffer = Extract<LegalAction, { kind: "activate-ability" }>;

/**
 * The polarity of each target slot of a cast or activation `legalActions`
 * offered, or `null` when there's no telling: a targeted modal spell (its
 * slots depend on the modes picked), an ability that isn't printed on the card
 * (granted — the grant isn't in the definition), a card the registry doesn't
 * know.
 */
export function offerPolarities(
  registry: CardRegistry,
  offer: CastOffer | ActivateOffer,
  bias?: PolarityBias,
): readonly Polarity[] | null {
  if (!registry.has(offer.cardName)) return null;
  const def = registry.get(offer.cardName);
  if (offer.kind === "activate-ability") {
    const ability = def.activated[offer.abilityIndex];
    return ability === undefined ? null : abilityPolarities(ability, bias);
  }
  if (offer.castModal !== undefined) return null;
  const face = offer.face !== undefined ? def.faces?.[offer.face] : undefined;
  if (face !== undefined && face !== def.name) {
    return registry.has(face) ? castPolarities(registry.get(face), bias) : null;
  }
  return castPolarities(def, bias);
}

/**
 * For a targeted modal spell `legalActions` offered (`castModal` — "choose one
 * or more —", each mode with targets of its own): the polarity of each target
 * slot of each mode, in the offer's mode order. `null` when the definition
 * can't be matched to the offer.
 */
export function modalPolarities(
  registry: CardRegistry,
  offer: CastOffer,
  bias?: PolarityBias,
): readonly (readonly Polarity[])[] | null {
  if (offer.castModal === undefined || !registry.has(offer.cardName)) return null;
  let def = registry.get(offer.cardName);
  const face = offer.face !== undefined ? def.faces?.[offer.face] : undefined;
  if (face !== undefined && face !== def.name) {
    if (!registry.has(face)) return null;
    def = registry.get(face);
  }
  const modes = def.castModal?.modes;
  if (modes === undefined || modes.length !== offer.castModal.modes.length) return null;
  const memo = memosFor(bias).mode;
  return modes.map((mode) => {
    let found = memo.get(mode);
    if (found === undefined) {
      found = slotPolarities(mode.effect, mode.targets?.length ?? 0, bias);
      memo.set(mode, found);
    }
    return found;
  });
}

/**
 * The polarity of each slot a pending `choose-targets` decision asks about,
 * in answer order — a triggered ability's (or its reflexive trigger's, or a
 * Saga chapter's), or a spell being cast for free. Slots filled automatically
 * (a saboteur's victim) come first and aren't asked, so they're dropped.
 */
export function pendingTargetPolarities(
  state: GameState,
  registry: CardRegistry,
  bias?: PolarityBias,
): readonly Polarity[] | null {
  const pending = state.pendingTargetedTrigger;
  if (pending === null) return null;
  let all: readonly Polarity[] | null = null;
  if (pending.reflexive !== undefined) {
    all = slotPolarities(pending.reflexive.effect, pending.reflexive.targets.length, bias);
  } else if (pending.grantedAbility === undefined && registry.has(pending.cardName)) {
    const def = registry.get(pending.cardName);
    if (pending.abilityKind === "chapter") {
      const chapter = def.chapters?.[pending.abilityIndex];
      all = chapter === undefined ? null : slotPolarities(chapter.effect, chapter.targets.length, bias);
    } else {
      const ability = def.triggered[pending.abilityIndex];
      const modal = ability?.effect?.kind === "modal" ? ability.effect : null;
      if (modal !== null && modal.announced === true && pending.modes !== undefined) {
        // An announced modal ability's slots are its chosen modes' targets,
        // in the order the modes are listed (rules 603.3c, 700.2b).
        all = pending.modes.flatMap((index) => {
          const mode = modal.modes[index];
          return mode === undefined ? [] : [...slotPolarities(mode.effect, mode.targets?.length ?? 0, bias)];
        });
      } else if (ability !== undefined) {
        all = abilityPolarities(ability, bias);
      }
    }
  }
  if (all === null) return null;
  const asked: Polarity[] = [];
  pending.slots.forEach((slot, index) => {
    if ("spec" in slot) asked.push(all[index] ?? "either");
  });
  return asked;
}

/** Whose side a target spec already restricts it to, if any. When it does,
 * the card chose the side and a bot shouldn't second-guess it — "target
 * creature you control" with a harmful effect is a cost, not a mistake. */
export type SpecSide = "you" | "opponent" | "any";

export function specSide(spec: TargetSpec): SpecSide {
  if (typeof spec === "object") {
    switch (spec.kind) {
      case "optional":
      case "other":
      case "any-number":
        return specSide(spec.of);
      case "permanent":
        // A seat-bound slot (Dismantling Wave): seat 0 is you, the rest
        // opponents.
        if (typeof spec.whose === "object") return spec.whose.seat === 0 ? "you" : "opponent";
        return spec.whose === "you"
          ? "you"
          : spec.whose === "opponent" || spec.whose === "trigger-player" || spec.whose === "defending-player"
            ? "opponent"
            : "any";
      case "spell":
        return spec.whose === "you" ? "you" : spec.whose === "opponent" ? "opponent" : "any";
      case "ability":
        return spec.whose === "you" ? "you" : "any";
      case "spell-or-permanent":
        return spec.whose === "you" ? "you" : spec.whose === "opponent" ? "opponent" : "any";
      case "card-in-graveyard":
        if (typeof spec.whose === "object") return spec.whose.seat === 0 ? "you" : "opponent";
        return spec.whose === "you" ? "you" : spec.whose === "opponent" || spec.whose === "defending-player" ? "opponent" : "any";
    }
  }
  switch (spec) {
    case "creature-you-control":
    case "land-you-control":
    case "instant-or-sorcery-in-your-graveyard":
      return "you";
    case "creature-an-opponent-controls":
    case "opponent":
    case "opponent-whose-turn-it-is":
    case "opponent-or-planeswalker":
    case "artifact-an-opponent-controls":
    case "creature-or-enchantment-an-opponent-controls":
    case "nonland-permanent-an-opponent-controls":
    case "creature-attacking-you":
    case "creature-defending-player-controls":
    case "artifact-enchantment-or-nonbasic-land-an-opponent-controls":
      return "opponent";
    default:
      return "any";
  }
}

/** Whose side a target is on, from `me`'s seat: a permanent or spell by its
 * controller, a card anywhere else by its owner. */
export function sideOf(state: GameState, ref: TargetRef, me: PlayerId): "own" | "opponent" | null {
  if (ref.kind === "player") return ref.player === me ? "own" : "opponent";
  const object = state.objects[ref.object];
  if (object === undefined) return null;
  const whose =
    object.zone === "battlefield" || object.zone === "stack" ? object.controller : object.owner;
  return whose === me ? "own" : "opponent";
}

function printedManaValue(registry: CardRegistry, name: string): number {
  if (!registry.has(name)) return 0;
  const cost = registry.get(name).manaCost;
  return cost === null ? 0 : manaValue(parseManaCost(cost));
}

/**
 * A cheap, static sense of how much a target is worth having — or of taking
 * away. Not the evaluation: it only has to order a handful of options so the
 * obvious one comes first. A creature by its stats (the commander counting
 * extra, as the one card always coming back), a planeswalker by its loyalty,
 * a land barely, anything else by its mana value.
 *
 * A player is worth more the closer they are to losing — the one a burn
 * spell should finish — on a scale that puts a healthy opponent's face below
 * a real creature and a dying one's above it.
 */
export function targetValue(state: GameState, registry: CardRegistry, ref: TargetRef): number {
  if (ref.kind === "player") {
    const life = state.players[ref.player]?.life ?? 0;
    return 3 + Math.max(0, 40 - life) / 4;
  }
  const object = state.objects[ref.object];
  if (object === undefined) return 0;
  const printed = printedManaValue(registry, printedCardName(object));
  if (object.zone !== "battlefield") return printed;
  const c = computeCharacteristics(state, registry, ref.object);
  if (c.types.includes("creature")) {
    return 1.5 * c.power + c.toughness + 0.5 * printed + c.keywords.size + (object.isCommander ? 5 : 0);
  }
  if (c.types.includes("planeswalker")) return 2 * (object.counters.loyalty ?? 0) + printed;
  if (c.types.includes("land")) return 0.5;
  return Math.max(1, printed);
}

/**
 * `options` best-first for a slot of this polarity, from `me`'s seat: the
 * right side first, most valuable first; then the wrong side, least valuable
 * first (the least bad, when only the wrong side is legal). `take` ranks
 * everything by value, whoever's it is; `either` leaves the offer's order
 * alone. Ties keep the offer's order, so a replay is exact. `value` is how
 * an option is priced — {@link targetValue}, or a caller's richer sense of it
 * (v2 adds how much of an engine a permanent is, `bot/features.ts`).
 */
export function rankTargets(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  options: readonly TargetRef[],
  polarity: Polarity,
  value: (state: GameState, registry: CardRegistry, ref: TargetRef) => number = targetValue,
): TargetRef[] {
  if (polarity === "either" || options.length < 2) return [...options];
  const want = polarity === "harm" ? "opponent" : "own";
  const scored = options.map((ref, index) => ({
    ref,
    index,
    right: polarity === "take" || sideOf(state, ref, me) === want,
    value: value(state, registry, ref),
  }));
  scored.sort((a, b) => {
    if (a.right !== b.right) return a.right ? -1 : 1;
    const byValue = a.right ? b.value - a.value : a.value - b.value;
    return byValue !== 0 ? byValue : a.index - b.index;
  });
  return scored.map((s) => s.ref);
}

/**
 * Whether this slot's legal options are all on the side its polarity says to
 * avoid — a Murder with only your own creatures to kill, a counterspell with
 * only your own spell on the stack. Only asked of a slot whose spec leaves
 * the side open: one that names it ("target creature you control") is the
 * card choosing, not the bot.
 */
export function onlyWrongSide(
  state: GameState,
  me: PlayerId,
  options: readonly TargetRef[],
  polarity: Polarity,
  spec: TargetSpec,
): boolean {
  if (polarity !== "harm" && polarity !== "help") return false;
  if (specSide(spec) !== "any" || options.length === 0) return false;
  const want = polarity === "harm" ? "opponent" : "own";
  return options.every((ref) => sideOf(state, ref, me) !== want);
}
