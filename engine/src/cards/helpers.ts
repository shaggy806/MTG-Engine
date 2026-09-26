/**
 * Shared building blocks for card files — the `{T}: Add {C}` mana ability every
 * basic land carries, and the `basicLand` constructor itself. Imported by files
 * under `pool/` and `tokens/`.
 */

import type { ActivatedAbility, TriggeredAbility } from "../abilities.js";
import { wardCostText, type EffectAmount, type EffectSpec, type WardCost } from "../effects.js";
import type { CardFilter } from "../filter.js";
import type { Color, ManaType } from "../mana.js";
import type { TargetSpec } from "../target.js";
import { defineCard, type CardDefinition, type StaticAbility } from "./define.js";

/** The placeholder for "the chosen creature type" inside a
 * `choose-creature-type` effect's `then` — re-exported here because card files
 * import only from `define` and `helpers`. */
export { CHOSEN_CREATURE_TYPE } from "../effects.js";

/**
 * "Two target lands", "up to two target creatures": one instance of the word
 * "target" spread over `n` slots, so the same object or player can be chosen
 * for only one of them (rule 601.2c). Each slot after the first is `other`
 * than every slot of the group before it. `optional` makes every slot "up
 * to"; `from` is the group's first slot when other slots come before it, and
 * `otherThan` names earlier slots outside the group that every slot must also
 * differ from — Drakuseth's "each of up to two **other** targets" is
 * `distinctTargets(2, "any-target", { optional: true, from: 1, otherThan: [0] })`.
 */
export const distinctTargets = (
  n: number,
  spec: TargetSpec,
  opts: { readonly optional?: boolean; readonly from?: number; readonly otherThan?: readonly number[] } = {},
): TargetSpec[] => {
  const from = opts.from ?? 0;
  return Array.from({ length: n }, (_, i) => {
    const earlier = [...(opts.otherThan ?? []), ...Array.from({ length: i }, (__, j) => from + j)];
    const slot: TargetSpec = earlier.length === 0 ? spec : { kind: "other", of: spec, than: { slots: earlier } };
    return opts.optional === true ? { kind: "optional", of: slot } : slot;
  });
};

/**
 * Ward (rule 702.21a): "Whenever this permanent becomes the target of a spell
 * or ability an opponent controls, counter that spell or ability unless that
 * player pays [cost]." A real triggered ability, so each instance triggers
 * on its own (702.21b), losing abilities removes it, and a static can grant
 * it to other permanents through `grantsTriggered` ("Goblins and Orcs you
 * control have ward {2}" is `grantsTriggered: [ward({ mana: "{2}" })]`).
 *
 * `ward({ mana: "{2}" })` is "Ward {2}"; `ward({ mana: "{2}", payLife: 2 })`
 * is "Ward—{2}, Pay 2 life." — one compound cost, paid all together. Put the
 * printed line in the card's `text` as well; this is the ability's own.
 */
export const ward = (cost: WardCost): TriggeredAbility => {
  if (cost.blight !== undefined) {
    throw new Error("ward: a blight cost isn't built yet (the blight keyword is unimplemented)");
  }
  return {
    trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
    targets: [],
    effect: { kind: "ward", cost },
    resolve: null,
    text: `Ward${wardCostText(cost)}`,
  };
};

/**
 * Melee (rule 702.121): "Whenever this creature attacks, it gets +1/+1 until
 * end of turn for each opponent you attacked with a creature this combat."
 * Each instance triggers on its own. Put "Melee" in `text` as well.
 */
export const melee = (): TriggeredAbility => ({
  trigger: { on: "attacks", who: "self" },
  targets: [],
  effect: {
    kind: "modify-pt",
    target: "source",
    power: { opponentsAttacked: true },
    toughness: { opponentsAttacked: true },
    duration: "end-of-turn",
  },
  resolve: null,
  text: "Melee",
});

/**
 * Annihilator N (rule 702.86): "Whenever this creature attacks, defending
 * player sacrifices N permanents." The defending player is the one it
 * attacks, or the controller of the planeswalker it attacks. A triggered
 * ability, so a static can grant it (`grantsTriggered`); each instance
 * triggers on its own. Put the printed line in the card's `text` as well.
 */
export const annihilator = (n: number): TriggeredAbility => ({
  trigger: { on: "attacks", who: "self" },
  targets: [],
  effect: { kind: "sacrifice", who: "trigger-player", filter: {}, count: n },
  resolve: null,
  text: `Annihilator ${n}`,
});

/**
 * Dethrone (rule 702.105a): "Whenever this creature attacks the player with
 * the most life or tied for most life, put a +1/+1 counter on this
 * creature." Every player in the game is compared, you included, and a
 * creature attacking a planeswalker isn't attacking a player (the attack
 * trigger's `defenderLife: "most"`). Not an intervening-if: the counter goes
 * on however life totals change before it resolves. A triggered ability, so
 * a static can grant it (Marchesa, the Black Rose's "other creatures you
 * control have dethrone" is a `grantsTriggered` of this) and each instance
 * triggers on its own (rule 702.105b). Put the printed line in the card's
 * `text` as well.
 */
export const dethrone = (): TriggeredAbility => ({
  trigger: { on: "attacks", who: "self", defenderLife: "most" },
  targets: [],
  effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
  resolve: null,
  text: "Dethrone",
});

/**
 * Station (rule 702.184a): "Tap another untapped creature you control: Put a
 * number of charge counters on this permanent equal to the tapped creature's
 * power. Activate only as a sorcery." The power is read as the ability
 * resolves, as the creature last existed if it has left (the station
 * ruling); a negative one puts nothing on. Tapping for it isn't the
 * creature's own {T}, so a summoning-sick creature can. It makes its card a
 * station card (702.184b), whose printed power and toughness are its station
 * symbol's (`stationBand`). `text` is the printed line, reminder text and all.
 */
export const station = (text: string): ActivatedAbility => ({
  cost: { mana: null, tap: false, tapOthers: { count: 1, filter: { type: "creature" } } },
  targets: [],
  effect: { kind: "add-counter", target: "source", counter: "charge", amount: { powerOf: "tapped" } },
  resolve: null,
  sorcerySpeed: true,
  station: true,
  text,
});

/**
 * Power-up (rule 702.193a): "Power-up — [Cost]: [Effect]" means "[Cost]:
 * [Effect]. If this permanent entered this turn, this ability's cost is
 * reduced by this permanent's mana cost. Activate this ability only once."
 * No timing restriction of its own. `mana` is the printed cost; the
 * reduction is worked out as it's activated (`Game.poweredUp`). `text` is
 * the printed line, reminder text and all.
 */
export const powerUp = (
  mana: string,
  effect: EffectSpec,
  text: string,
  targets: readonly TargetSpec[] = [],
): ActivatedAbility => ({
  cost: { mana, tap: false },
  targets,
  effect,
  resolve: null,
  powerUp: true,
  text,
});

/**
 * A station symbol (rule 721.2): a static ability giving its permanent what
 * the symbol's striation holds while it has `at` or more charge counters —
 * abilities (721.2a), and with a power/toughness box, being a creature with
 * that base power and toughness in addition to its other types (721.2b:
 * `addTypes: ["creature"]` and `setBasePt`). Counters from anywhere count,
 * proliferate's included, and losing them takes the abilities away.
 */
export const stationBand = (at: number, band: Omit<StaticAbility, "affects" | "condition">): StaticAbility => ({
  ...band,
  affects: { scope: "self" },
  condition: { kind: "source", filter: { counters: { kind: "charge", compare: { op: "gte", n: at } } } },
});

/**
 * Affinity for [something] (rule 702.41a): "This spell costs {1} less to
 * cast for each [something] you control" — the card's `selfCostReduction`.
 * `filter` is the something, and is counted among the caster's permanents
 * as the spell is cast: `affinity({ type: "artifact" })` is affinity for
 * artifacts, `affinity({ types: ["artifact", "creature"] })` for artifact
 * creatures. It only ever reduces generic mana (rule 601.2f). Put the
 * printed line in the card's `text` as well.
 */
export const affinity = (filter: CardFilter): NonNullable<CardDefinition["selfCostReduction"]> => ({
  // Unconditional: the always-true gate Blasphemous Act uses.
  condition: { kind: "controls", filter: {}, atLeast: 0 },
  reduceGeneric: { countOf: { ...filter, controlledBy: "you" } },
});

/**
 * "[Spells] you cast have affinity for [something]" — affinity granted to
 * other spells, as a `costModification` static on the permanent that grants
 * it: each spell its controller casts matching `spells` costs {1} less for
 * each permanent matching `filter` they control. Like every static on a
 * permanent it works only while that permanent is on the battlefield, and
 * two grants both apply, as two instances of affinity would (rule 702.41b).
 * A card whose own affinity is printed as well carries `affinity(filter)`
 * beside this.
 */
export const grantAffinity = (spells: CardFilter, filter: CardFilter, text: string): StaticAbility => ({
  affects: { scope: "self" },
  costModification: {
    applies: spells,
    caster: "you",
    reduceGeneric: { countOf: { ...filter, controlledBy: "you" } },
  },
  text,
});

/**
 * Firebending N: "Whenever this creature attacks, add N {R}. This mana lasts
 * until end of combat." A triggered ability, so a static can grant it
 * (`grantsTriggered`) and losing abilities removes it; `amount` may be an
 * amount ("firebending X, where X is this creature's power" is `{ powerOf:
 * "source" }`, read as it resolves). Put the printed line in the card's
 * `text` as well; this is the ability's own.
 */
export const firebending = (amount: EffectAmount, text?: string): TriggeredAbility => ({
  trigger: { on: "attacks", who: "self" },
  targets: [],
  effect: { kind: "add-mana", mana: "R", amount, untilEndOfCombat: true },
  resolve: null,
  text: text ?? `Firebending ${typeof amount === "number" ? amount : "X"}`,
});

/**
 * Extort (rule 702.101a): "Whenever you cast a spell, you may pay {W/B}. If
 * you do, each opponent loses 1 life and you gain that much life." A
 * triggered ability, so each instance triggers separately. "That much" is
 * the life the opponents actually lost (`lifeLostThisWay`): an opponent who
 * can't lose life gives nothing (Crypt Ghast's ruling).
 */
export const extort = (): TriggeredAbility => ({
  trigger: { on: "cast-spell", who: "you" },
  targets: [],
  effect: {
    kind: "may",
    prompt: "Pay {W/B} to extort?",
    cost: "{W/B}",
    effect: {
      kind: "sequence",
      effects: [
        { kind: "lose-life", amount: 1, who: "each-opponent" },
        { kind: "gain-life", amount: { lifeLostThisWay: true, who: "each-opponent" } },
      ],
    },
  },
  resolve: null,
  text: "Extort",
});

/**
 * Investigate (rule 701.36a): "create a Clue token", `times` over —
 * "investigate twice" is `investigate(2)`. It's a keyword action with no
 * effect of its own beyond the token, so it's written as the `create-token`
 * it is rather than a new effect kind: every token multiplier, stack rule
 * and count-scaling check already reads that. The Clue is an ordinary token
 * with an activated ability, so it's never folded into a token stack.
 */
export const investigate = (times: EffectAmount = 1): EffectSpec => ({
  kind: "create-token",
  token: "Clue Token",
  count: times,
});

/**
 * The enters trigger "Partner with [name]" carries alongside its deckbuilding
 * half (rule 702.124): "When this creature enters, target player may search
 * their library for a card named [name], reveal it, put it into their hand,
 * then shuffle." Pair it with `pairing: { kind: "partner-with", name }` —
 * the two are one printed keyword, so a card with one has both.
 */
export const partnerWithTrigger = (name: string): TriggeredAbility => ({
  trigger: { on: "enters-battlefield", who: "self" },
  targets: ["player"],
  effect: {
    kind: "search-library",
    filter: { name },
    destination: "hand",
    // "may search": optional for the target, you included.
    min: 0,
    max: 1,
    reveal: true,
    who: { controllerOfTarget: 0 },
  },
  resolve: null,
  text:
    `When this creature enters, target player may search their library for a card named ${name}, ` +
    "reveal it, put it into their hand, then shuffle.",
});

/** The `{T}: Add {C}` ability every mana-producing basic land has. */
export const manaTapAbility = (mana: Color): ActivatedAbility => ({
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana, amount: 1 },
  resolve: null,
  text: `{T}: Add {${mana}}.`,
});

/**
 * A `{T}: Add …` mana ability for a rock or utility land — `mana` may be a
 * concrete type or `"any-color"` (Arcane Signet, Command Tower, Treasure),
 * `amount` defaults to 1, and `sacrifice: "self"` makes it a Treasure-style
 * one-shot ("{T}, Sacrifice this: …").
 */
export const addManaAbility = (opts: {
  mana: ManaType | "any-color" | "commander-identity";
  amount?: number;
  sacrifice?: "self";
  text: string;
}): ActivatedAbility => ({
  cost: {
    mana: null,
    tap: true,
    ...(opts.sacrifice === undefined ? {} : { sacrifice: opts.sacrifice }),
  },
  targets: [],
  effect: { kind: "add-mana", mana: opts.mana, amount: opts.amount ?? 1 },
  resolve: null,
  text: opts.text,
});

/**
 * The unconditional "~ enters the battlefield tapped" self-replacement most
 * nonbasic lands carry (Grovewatch Hollow, the temples, the trilands).
 */
export const entersTappedStatic = (name: string): StaticAbility => ({
  affects: { scope: "self" },
  replacement: { event: "enters-battlefield", tapped: true },
  text: `${name} enters the battlefield tapped.`,
});

/** "a Mountain" / "an Island" — the indefinite article for a land-type word. */
const withArticle = (word: string): string =>
  `${/^[AEIOU]/.test(word) ? "an" : "a"} ${word}`;

const BASIC_LAND_MANA: Readonly<Record<string, Color>> = {
  Plains: "W",
  Island: "U",
  Swamp: "B",
  Mountain: "R",
  Forest: "G",
};

/**
 * The "~ enters the battlefield tapped unless you control [one of these basic
 * land types]" self-replacement of the check-land cycle (Rootbound Crag,
 * Sulfur Falls, Hinterland Harbor).
 */
export const checkLandStatic = (
  name: string,
  landTypes: readonly [string, string],
): StaticAbility => ({
  affects: { scope: "self" },
  replacement: {
    event: "enters-battlefield",
    tappedUnless: { kind: "controls", filter: { subtypes: landTypes }, atLeast: 1 },
  },
  text: `${name} enters the battlefield tapped unless you control ${withArticle(
    landTypes[0],
  )} or ${withArticle(landTypes[1])}.`,
});

/**
 * A "shock land" (Blood Crypt, Overgrown Tomb, Stomping Ground): "As ~ enters
 * the battlefield, you may pay 2 life. If you don't, it enters tapped." Typed
 * with its two basic land types, so it also taps for both colours and counts
 * for a check land. Raised as a `pay-life-for-untapped` decision.
 */
export const shockLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes.map((t) => BASIC_LAND_MANA[t]).filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    subtypes: [...landTypes],
    text:
      `As ${name} enters the battlefield, you may pay 2 life. ` +
      `If you don't, ${name} enters the battlefield tapped.\n` +
      `({T}: Add ${landTypes.map((t) => `{${BASIC_LAND_MANA[t]}}`).join(" or ")}.)`,
    static: [
      {
        affects: { scope: "self" },
        replacement: { event: "enters-battlefield", mayPayLife: 2 },
        text: `As ${name} enters the battlefield, you may pay 2 life. If you don't, ${name} enters the battlefield tapped.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "reveal land" (Port Town, Game Trail, Foreboding Ruins, Fortified
 * Village): "As ~ enters, you may reveal a [type] or [type] card from your
 * hand. If you don't, it enters tapped."
 *
 * Unlike a check land, the condition reads your *hand* rather than the
 * battlefield — and unlike a shock land, it isn't typed with the two basic
 * land types, so it doesn't itself turn on a check land. The engine reveals
 * automatically whenever it can; see `tappedUnlessRevealFromHand`.
 */
export const revealLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    text:
      `As ${name} enters, you may reveal ${withArticle(landTypes[0])} or ` +
      `${withArticle(landTypes[1])} card from your hand. If you don't, ` +
      `${name} enters tapped.\n` +
      `{T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.`,
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "enters-battlefield",
          tappedUnlessRevealFromHand: [...landTypes],
        },
        text:
          `As ${name} enters, you may reveal ${withArticle(landTypes[0])} or ` +
          `${withArticle(landTypes[1])} card from your hand. If you don't, ${name} enters tapped.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "tap land" — enters tapped, taps for either of two colours (Shivan Oasis,
 * Timber Gorge). `gainLife` adds the "when this enters, you gain 1 life"
 * clause of the common-land life cycle (Kazandu Refuge, Rugged Highlands).
 *
 * Deliberately *not* typed with its two basic land types: these are plain
 * nonbasic lands, so they don't switch on a check land the way a shock or
 * dual land does.
 */
export const tapLand = (
  name: string,
  landTypes: readonly [string, string],
  gainLife = false,
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters tapped.\n` +
      (gainLife ? `When ${name} enters, you gain 1 life.\n` : "") +
      `{T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.`,
    static: [entersTappedStatic(name)],
    triggered: gainLife
      ? [
          {
            trigger: { on: "enters-battlefield", who: "self" },
            targets: [],
            effect: { kind: "gain-life", amount: 1 },
            resolve: null,
            text: `When ${name} enters, you gain 1 life.`,
          },
        ]
      : [],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "Signet" (Azorius Signet, Dimir Signet, Rakdos Signet, …): a `{2}` artifact
 * with "{1}, {T}: Add [two colours]".
 *
 * Net +1 mana and colour-fixing, which is why it has a mana cost of its own —
 * see `ManaOption.genericCost`, the machinery that lets the auto-payer fund it
 * from other sources.
 */
export const signet = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
    text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
    activated: [
      {
        cost: { mana: "{1}", tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { all: colors }, amount: 1 },
        resolve: null,
        text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
      },
    ],
  });

/**
 * A "Battlebond land" (Morphic Pool, Sea of Clouds, Training Center, …): a
 * two-colour land that "enters tapped unless you have two or more opponents".
 *
 * Ten cards on one template, and the only reason they weren't authorable is
 * that nothing could ask how many opponents you had — hence the
 * `opponent-count` {@link StaticCondition}. In a Commander pod the condition
 * is usually true, which is the point of the cycle: these are untapped duals
 * in multiplayer and tapped ones in a duel.
 */
export const battlebondLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters tapped unless you have two or more opponents.
` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "enters-battlefield",
          tappedUnless: { kind: "opponent-count", atLeast: 2 },
        },
        text: `${name} enters tapped unless you have two or more opponents.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });

const NUM_WORD: Readonly<Record<number, string>> = { 2: "two", 3: "three", 4: "four" };

/**
 * "~ enters the battlefield tapped unless you control [N] or more [basic lands
 * / other lands]" — Cinder Glade ("two or more basic lands"), Rockfall Vale
 * ("two or more other lands", + a `painIfUntapped` on the card).
 */
/**
 * A "tri-land" (Arcane Sanctum, Nomad Outpost, Savage Lands, …): an untyped
 * land that enters tapped and taps for any one of three colours.
 *
 * Two cycles of five share this shape exactly. Untyped on purpose — unlike
 * {@link tapLand} these carry no basic land types, so nothing else keys off
 * them (a check land doesn't see one as a Swamp).
 */
/**
 * An Odyssey "filter land" (Darkwater Catacombs, Skycloud Expanse, …):
 * "{1}, {T}: Add [two colours]".
 *
 * The same economics as a {@link signet} — net +1 mana and colour-fixing, paid
 * for with generic — so it reaches the auto-payer the same way, as a
 * "converter" the planner funds from ordinary sources and orders last. Not to
 * be confused with the Shadowmoor filter lands (Flooded Grove), whose
 * activation cost is a *hybrid* pip.
 */
export const filterLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
    activated: [
      {
        cost: { mana: "{1}", tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { all: colors }, amount: 1 },
        resolve: null,
        text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
      },
    ],
  });

/**
 * A "Karoo" / bounce land (Azorius Chancery, Gruul Turf, ...): enters tapped,
 * returns a land you control to your hand as it enters, and taps for two mana
 * of its two colours at once.
 *
 * Ten cards on one template. The bounce is a *choice* on the printed card and
 * a target here (`land-you-control`), because the engine has no "choose a
 * permanent you control" for a return; see that spec for why the difference
 * doesn't bite. The land may return itself, which is what the printed card
 * does when it is your only one.
 */
export const karooLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters tapped.
` +
      `When ${name} enters, return a land you control to its owner's hand.
` +
      `{T}: Add {${colors[0]}}{${colors[1]}}.`,
    static: [entersTappedStatic(name)],
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: ["land-you-control"],
        effect: { kind: "return-to-hand", target: 0 },
        resolve: null,
        text: `When ${name} enters, return a land you control to its owner's hand.`,
      },
    ],
    activated: [
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { all: colors }, amount: 1 },
        resolve: null,
        text: `{T}: Add {${colors[0]}}{${colors[1]}}.`,
      },
    ],
  });

/**
 * A "Triome" (Raugrin Triome, Jetmir's Garden, …): a *typed* tri-land that
 * enters tapped and has cycling {3}.
 *
 * Unlike {@link triLand} these carry all three basic land types, so they feed
 * everything that keys off a type — a check land sees one as a Swamp. The
 * colours are derived from the types for that reason, rather than passed in
 * and allowed to disagree with them.
 */
export const triomeLand = (
  name: string,
  landTypes: readonly [string, string, string],
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    subtypes: [...landTypes],
    text: `${name} enters tapped.
Cycling {3}`,
    static: [entersTappedStatic(name)],
    cycling: { cost: "{3}" },
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

export const triLand = (
  name: string,
  colors: readonly [Color, Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text: `${name} enters tapped.
{T}: Add {${colors[0]}}, {${colors[1]}}, or {${colors[2]}}.`,
    static: [entersTappedStatic(name)],
    activated: colors.map((c) => manaTapAbility(c)),
  });

/**
 * A "fast land" (Blackcleave Cliffs, Seachrome Coast, Spirebluff Canal): "This
 * land enters tapped unless you control two or fewer other lands. {T}: Add
 * {X} or {Y}." The condition leaves the entering land out of the count, as a
 * static's condition does (`ConditionOptions.includeSelf`), so it's "not
 * three or more lands" — its first three land drops come in untapped.
 */
export const fastLand = (name: string, colors: readonly [Color, Color]): CardDefinition => {
  const entry = "This land enters tapped unless you control two or fewer other lands.";
  return defineCard({
    name,
    types: ["land"],
    text: `${entry}
{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "enters-battlefield",
          tappedUnless: { kind: "not", of: { kind: "controls", filter: { type: "land" }, atLeast: 3 } },
        },
        text: entry,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "Thriving" land (Thriving Isle, Thriving Heath): enters tapped, and as it
 * enters its controller chooses one of the four colours other than its own;
 * it taps for its own colour or the chosen one. The choice is asked before it
 * moves (rule 614.12 — `askEnterChoice`), like Heraldic Banner's.
 */
export const thrivingLand = (name: string, color: Color): CardDefinition => {
  const others = (["W", "U", "B", "R", "G"] as const).filter((c) => c !== color);
  return defineCard({
    name,
    types: ["land"],
    text:
      `This land enters tapped. As it enters, choose a color other than ${COLOR_WORD[color].toLowerCase()}.
` +
      `{T}: Add {${color}} or one mana of the chosen color.`,
    chooseOnEnter: others,
    static: [
      {
        affects: { scope: "self" },
        replacement: { event: "enters-battlefield", tapped: true },
        text: "This land enters tapped.",
      },
    ],
    activated: [
      manaTapAbility(color),
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: "chosen", amount: 1 },
        resolve: null,
        text: "{T}: Add one mana of the chosen color.",
      },
    ],
  });
};

export const enterTappedUnlessLands = (
  name: string,
  atLeast: number,
  what: "basic" | "any",
): StaticAbility => ({
  affects: { scope: "self" },
  replacement: {
    event: "enters-battlefield",
    tappedUnless: {
      kind: "controls",
      filter: what === "basic" ? { supertype: "basic", type: "land" } : { type: "land" },
      atLeast,
    },
  },
  text: `${name} enters the battlefield tapped unless you control ${
    NUM_WORD[atLeast] ?? atLeast
  } or more ${what === "basic" ? "basic lands" : "other lands"}.`,
});

/**
 * A "{T}, Pay 1 life, Sacrifice ~: Search your library for a [type-A] or
 * [type-B] card, put it onto the battlefield, then shuffle" fetch land
 * (Wooded Foothills, Bloodstained Mire, Verdant Catacombs).
 */
export const fetchLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const text = `{T}, Pay 1 life, Sacrifice ${name}: Search your library for ${withArticle(
    landTypes[0],
  )} or ${withArticle(landTypes[1])} card, put it onto the battlefield, then shuffle.`;
  return defineCard({
    name,
    types: ["land"],
    text,
    activated: [
      {
        cost: { mana: null, tap: true, sacrifice: "self", payLife: 1 },
        targets: [],
        effect: {
          kind: "search-library",
          filter: { type: "land", subtypes: landTypes },
          destination: "battlefield",
          min: 0,
          max: 1,
        },
        resolve: null,
        text,
      },
    ],
  });
};

/**
 * The Streets-of-New-Capenna tri-land fetch cycle (Cabaretti Courtyard,
 * Riveteers Overlook, …): "When this land enters, sacrifice it. When you do,
 * search your library for a basic [A], [B], or [C] card, put it onto the
 * battlefield tapped, then shuffle and you gain 1 life."
 *
 * Unlike {@link fetchLand} it is a *trigger*, not an activated ability — the
 * land never taps for mana itself and never sits on the battlefield, so it has
 * no mana abilities at all. The "when you do" reflexive trigger is the
 * `sacrifice-source` effect's `then`, which only runs if the sacrifice
 * actually happened.
 */
export const sacrificeFetchLand = (
  name: string,
  landTypes: readonly [string, string, string],
): CardDefinition => {
  const text =
    `When ${name} enters, sacrifice it. When you do, search your library for a basic ` +
    `${landTypes[0]}, ${landTypes[1]}, or ${landTypes[2]} card, put it onto the ` +
    `battlefield tapped, then shuffle and you gain 1 life.`;
  return defineCard({
    name,
    types: ["land"],
    text,
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: [],
        effect: {
          kind: "sacrifice-source",
          then: {
            kind: "sequence",
            effects: [
              {
                kind: "search-library",
                filter: { type: "land", supertype: "basic", subtypes: landTypes },
                destination: "battlefield",
                // "Search … for a basic land card" is mandatory on the printed
                // card, but a whiff has to be legal, and `min: 0` is how the
                // engine expresses "take one if there is one".
                min: 0,
                max: 1,
                enterTapped: true,
              },
              { kind: "gain-life", amount: 1 },
            ],
          },
        },
        resolve: null,
        text,
      },
    ],
  });
};

/**
 * A "pain land" (Karplusan Forest, Shivan Reef, Yavimaya Coast): "{T}: Add
 * {C}." plus "{T}: Add {A} or {B}. ~ deals 1 damage to you." — the coloured
 * tap hurts, the colourless one doesn't. The auto-payer reaches for the
 * painless option first (see `Game.chooseOption`).
 */
export const painLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      "{T}: Add {C}.\n" +
      `{T}: Add {${colors[0]}} or {${colors[1]}}. ${name} deals 1 damage to you.`,
    activated: [
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: "C", amount: 1 },
        resolve: null,
        text: "{T}: Add {C}.",
      },
      ...colors.map((c) => ({
        cost: { mana: null, tap: true },
        targets: [],
        effect: {
          kind: "add-mana" as const,
          mana: c,
          amount: 1,
          painToController: 1,
        },
        resolve: null,
        text: `{T}: Add {${c}}. ${name} deals 1 damage to you.`,
      })),
    ],
  });

/**
 * A "scry land" (the Theros temple cycle — Temple of Epiphany, Temple of
 * Silence): enters tapped, scries 1 on the way in, taps for either of two
 * colours.
 */
export const scryLand = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters the battlefield tapped.\n` +
      `When ${name} enters the battlefield, scry 1.\n` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [entersTappedStatic(name)],
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: [],
        effect: { kind: "scry", amount: 1 },
        resolve: null,
        text: `When ${name} enters the battlefield, scry 1.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });

/**
 * A "slow land" (the Innistrad: Midnight Hunt / Crimson Vow cycle — Shipwreck
 * Marsh, Deserted Beach): "enters tapped unless you control two or more *other*
 * lands". Same shape as `Rockfall Vale` without its pain rider.
 */
export const slowLand = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters the battlefield tapped unless you control two or more other lands.\n` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [enterTappedUnlessLands(name, 2, "any")],
    activated: colors.map((c) => manaTapAbility(c)),
  });

/**
 * An original dual land (Underground Sea, Tundra): two basic land types and
 * nothing else — no printed rules text at all, since both mana abilities come
 * from the types.
 */
export const dualLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    subtypes: [...landTypes],
    text: `({T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.)`,
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * An artifact land (Seat of the Synod, Vault of Whispers) — a land that is also
 * an artifact, tapping for one fixed colour.
 */
export const artifactLand = (name: string, produces: Color): CardDefinition =>
  defineCard({
    name,
    types: ["artifact", "land"],
    text: `{T}: Add {${produces}}.`,
    activated: [manaTapAbility(produces)],
  });

/**
 * A "Medallion" (Jet Medallion, Ruby Medallion): a {2} artifact making your
 * spells of one colour cost {1} less.
 */
export const medallion = (name: string, color: Color): CardDefinition => {
  const text = `${colorWord(color)} spells you cast cost {1} less to cast.`;
  return defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
    text,
    static: [
      {
        affects: { scope: "self" },
        costModification: { applies: { colors: [color] }, reduceGeneric: 1 },
        text,
      },
    ],
  });
};

const COLOR_WORD: Readonly<Record<Color, string>> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};
const colorWord = (c: Color): string => COLOR_WORD[c];

/**
 * A "Talisman" (Talisman of Dominance, Talisman of Progress, …): a {2} artifact
 * with exactly a pain land's ability set — "{T}: Add {C}." plus "{T}: Add {A} or
 * {B}. ~ deals 1 damage to you." The auto-payer reaches for the painless option
 * first, same as `painLand`.
 */
export const talisman = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
    text:
      "{T}: Add {C}.\n" +
      `{T}: Add {${colors[0]}} or {${colors[1]}}. ${name} deals 1 damage to you.`,
    activated: [
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: "C", amount: 1 },
        resolve: null,
        text: "{T}: Add {C}.",
      },
      ...colors.map((c) => ({
        cost: { mana: null, tap: true },
        targets: [],
        effect: {
          kind: "add-mana" as const,
          mana: c,
          amount: 1,
          painToController: 1,
        },
        resolve: null,
        text: `{T}: Add {${c}}. ${name} deals 1 damage to you.`,
      })),
    ],
  });

export const basicLand = (
  name: string,
  subtype: string,
  produces: Color,
): CardDefinition =>
  defineCard({
    name,
    supertypes: ["basic"],
    types: ["land"],
    subtypes: [subtype],
    text: `({T}: Add {${produces}}.)`,
    activated: [manaTapAbility(produces)],
  });
