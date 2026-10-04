/**
 * A redacted, self-contained snapshot of the game from one player's seat.
 *
 * Hidden information stays hidden: you see your own hand in full, an
 * opponent's hand only as ids (so a client can render face-down cards —
 * accurate in count and slot, but not identity), and library contents are
 * never exposed except where something specific reveals them (the top card,
 * or a look-and-choose effect's candidates). Battlefield and stack objects
 * carry their **computed** characteristics, so a client never needs the card
 * registry or the layer system to render a board.
 */

import type { CardRegistry, CardType, CombatRestriction, Keyword, Supertype } from "./cards.js";
import { supertypesOf } from "./filter.js";
import {
  abilitiesLostAt,
  computeCharacteristics,
  extraIntrinsicManaColors,
  hasLostAbilities,
  inactiveStandIn,
  intrinsicManaColors,
  modifierGrantApplies,
  restrictionsOf,
  withComputedCache,
} from "./characteristics.js";
import type { GameEvent } from "./events.js";
import type { Color, ManaPool } from "./mana.js";
import { poolCounts } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type {
  AwaitingDecision,
  DecisionSource,
  GameObject,
  GameResult,
  GameState,
  PlayerCounterKind,
  PriorityState,
  PublicStint,
  TurnState,
  ZoneType,
} from "./state.js";
import { decisionHasSource } from "./decisions/registry.js";
import { goadersOf } from "./goad.js";
import { activePlayerOf, faceName, manaCostOverride, nameOf, printedCardName } from "./state.js";
import { withoutTypeMarkers } from "./subtypes.js";
import type { TargetRef } from "./target.js";

export interface PublicPlayerInfo {
  readonly id: PlayerId;
  readonly life: number;
  readonly manaPool: ManaPool;
  readonly handSize: number;
  readonly librarySize: number;
  readonly graveyardSize: number;
  readonly landsPlayedThisTurn: number;
  /** How many lands this player may play this turn — the rules' one, plus
   * extra land drops (Oracle of Mul Daya, Explore). */
  readonly maxLandsThisTurn: number;
  readonly hasLost: boolean;
  readonly lossReason: string | null;
  /** Combat damage this player has taken from each commander so far, one
   * entry per commander that has dealt any (rule 903.10a — 21 from one
   * commander loses the game). */
  readonly commanderDamageTaken: readonly CommanderDamage[];
  /** Times this player has cast each commander (by name) from the command
   * zone — each adds {2} generic to that commander's cost next time (rule
   * 903.8). */
  readonly commanderCastCounts: Readonly<Record<string, number>>;
  /** Energy counters this player has ({E} — rule 122 / ROADMAP Phase 10). */
  readonly energy: number;
  /** The other counters this player has — poison, experience (rule 122.1;
   * see `PlayerState.counters`). A kind they have none of is absent. Ten
   * poison counters lose the game (`POISON_LETHAL`). */
  readonly counters: Readonly<Partial<Record<PlayerCounterKind, number>>>;
}

/** Combat damage one commander has dealt one player. */
export interface CommanderDamage {
  readonly commander: ObjectId;
  /** The commander's name — also given for a commander that isn't visible to
   * this viewer right now (tucked into a library, say). */
  readonly name: string;
  readonly owner: PlayerId;
  /** Its owner's chosen printing, as on `VisibleObject.art`. */
  readonly art: string | null;
  readonly amount: number;
}

/** The damage needed from one commander to lose (rule 903.10a). */
export const COMMANDER_DAMAGE_LETHAL = 21;

export interface VisibleObject {
  readonly id: ObjectId;
  /** This permanent's true identity ("Clone"). Render the *face* from
   * `copyOf ?? cardName`, but name it in the log by `cardName`. */
  readonly cardName: string;
  /** The name this permanent is a copy of (rule 707), or `null`. Its
   * mana cost / text / computed P/T already reflect the copy. */
  readonly copyOf: string | null;
  /** The name of the multi-face card's up face (rule 712 — ROADMAP Phase 10);
   * `= cardName` for a single-faced card. The client renders the face from
   * `copyOf ?? faceName`. `faces` lists all of them (front first) or is `null`. */
  readonly faceName: string;
  /** The name a copy exception gave it ("except its name is Mishra's
   * Warform"), when that isn't its card's — the name to show, while
   * `copyOf ?? faceName` still says which card's face to draw. */
  readonly name?: string;
  readonly faces: readonly string[] | null;
  /** A Scryfall link pinning this card's art (its up face's / copied card's),
   * or `null` for the by-name lookup. See `CardDefinition.art`. Carries the
   * printing this card's owner brought when they chose one (`DeckList.printings`). */
  readonly art: string | null;
  /** The up face is the card's *second printed image* — a transforming DFC
   * turned over, or an MDFC's other face; false for an adventure's spell
   * half, which shares one image with its creature. A client needs this to
   * ask for the right side of a printing named by card id. */
  readonly faceIsBack: boolean;
  readonly owner: PlayerId;
  readonly controller: PlayerId;
  readonly zone: ZoneType;
  readonly manaCost: string | null;
  /**
   * What this card *actually* costs right now, when that differs from the
   * printed `manaCost` — Blasphemous Act at {1}{R} with nine creatures out,
   * a commander carrying tax, a spell being taxed by Thalia.
   *
   * Absent when nothing has changed the cost, so a client can render
   * `manaCost` and only reach for this when it's there. Only ever set for
   * cards in the **viewer's own** hand or command zone: it's the cost *they*
   * would pay, and computing it for another seat's cards would be both
   * meaningless and a small information leak.
   *
   * Only the generic portion is rewritten, because that is the only part any
   * cost modification touches — which keeps this exact rather than a
   * re-serialisation of a parsed cost that could get hybrid or Phyrexian
   * pips wrong.
   */
  readonly effectiveManaCost?: string;
  readonly text: string;
  readonly types: readonly CardType[];
  /** "Legendary", "Basic", "Snow", "World" as they apply now (rule 205.4):
   * a copy made "not legendary" isn't (`supertypesOf`). */
  readonly supertypes: readonly Supertype[];
  readonly subtypes: readonly string[];
  /** Computed power/toughness; `null` for objects that are not creatures. */
  readonly power: number | null;
  readonly toughness: number | null;
  /** A planeswalker's loyalty — its `counters.loyalty` on the battlefield,
   * its printed loyalty anywhere else — or `null` for anything else. */
  readonly loyalty: number | null;
  readonly keywords: readonly Keyword[];
  /** Combat restrictions from static abilities (`"cant-attack"` from a
   * Pacifism, `"must-attack"` from Juggernaut). */
  readonly restrictions: readonly CombatRestriction[];
  /** Computed colours (rule 105 / layer 5) — e.g. `["U"]` for a Turn-to-
   * Frogged permanent, `[]` for something colourless. */
  readonly colors: readonly Color[];
  readonly tapped: boolean;
  readonly damageMarked: number;
  /** Regeneration shields waiting to replace its next destruction this turn
   * (rule 701.19) — public, like the damage they'd answer. */
  readonly regenerationShields: number;
  readonly counters: Readonly<Record<string, number>>;
  readonly summoningSick: boolean;
  /** A player, or an opponent's planeswalker (an `ObjectId`), or `null`. */
  readonly attacking: PlayerId | ObjectId | null;
  readonly blocking: ObjectId | null;
  /** An attacker that has been blocked this combat — and stays blocked
   * after its blockers leave (rule 509.1h), which no blocker's `blocking`
   * can show. Lets a board tile standing for several attacking tokens say
   * how many of them are blocked. */
  readonly blocked: boolean;
  readonly kind: "card" | "ability";
  readonly sourceObjectId: ObjectId | null;
  readonly abilityIndex: number | null;
  readonly targets: readonly TargetRef[] | null;
  /** The value chosen for `{X}` if this is an X spell/permanent, else `null`. */
  readonly xValue: number | null;
  readonly isToken: boolean;
  /**
   * How many identical tokens this one object stands for (`GameObject.
   * stackCount`), or `null` for the ordinary one-object-one-permanent case.
   * A purely internal resource-safety compaction — but the board would
   * otherwise show one 1/1 where the player really has thousands, so the
   * client renders it as a `×N` badge.
   */
  readonly stackCount: number | null;
  /** A copy of a spell on the stack (storm / Twincast) — ROADMAP Phase 8. */
  readonly isCopy: boolean;
  /** Suspended in exile with time counters (`counters.time`) — ROADMAP Phase 6b. */
  readonly suspended: boolean;
  /** Foretold — face-down in exile, castable later for its foretell cost.
   * Only ever `true` in the owner's own view (opponents don't see the id's
   * entry in `objects` at all). */
  readonly foretold: boolean;
  /** The permanent this Aura/Equipment is attached to, or `null`. */
  readonly attachedTo: ObjectId | null;
  /** Is this its owner's designated commander (rule 903)? */
  readonly isCommander: boolean;
  /** Every player who has goaded this creature (rule 701.15), however —
   * a one-shot goad, one for the rest of the game, or a static one (`goad.ts`'s
   * `goadersOf`). Empty off the battlefield or when it isn't goaded. A
   * designation, not an ability, so nothing else in the view shows it. */
  readonly goadedBy: readonly PlayerId[];
  /** Suspected (rule 701.60). Its menace and can't-block already show among
   * `keywords` and `restrictions`; this is the designation itself. */
  readonly suspected: boolean;
  /** On a permanent: the cards in exile linked to it — what an O-Ring holds
   * until it leaves (rule 720.2 — Banishing Light), or cards exiled with it
   * that it lets someone play (Theater of Horrors, Maralen). Ids only: a
   * card exiled face down (rule 406.3) is in the list, but its identity
   * stays out of `objects` for a seat that can't look at it, so a client
   * draws a card back. Absent when it holds nothing. */
  readonly holding?: readonly ObjectId[];
  /** On a permanent: what was chosen as it entered (rule 614.12) — a word
   * (Frostcliff Siege's "Jeskai" or "Temur"), a colour letter (Heraldic
   * Banner's `"U"`), a number, or a creature type (Urza's Incubator). Public:
   * the choice is announced. Absent when it had nothing to choose. */
  readonly chosen?: string;
}

export interface PlayerView {
  readonly turnOrder: readonly PlayerId[];
  /** Who the "highroll" (or a configured `startingPlayer`) chose to go
   * first — fixed for the life of the game, unlike `activePlayer`. */
  readonly startingPlayer: PlayerId;
  readonly activePlayer: PlayerId;
  readonly turn: TurnState;
  readonly priority: PriorityState;
  readonly awaiting: AwaitingDecision | null;
  /**
   * The card behind `awaiting` — what a client shows so a forced sacrifice or
   * discard isn't a prompt out of nowhere. `null` when nothing is pending, or
   * when the decision isn't any one card's doing (combat declarations, the
   * cleanup discard, the mulligan).
   *
   * The named object is usually in `objects` (a sorcery asking as it
   * resolves is still on the stack, an ability's source on the battlefield),
   * but not always — a spell that exiled itself, or a face-down foretold card
   * — so `cardName` stands on its own and a client must tolerate a missing
   * `objects[object]`.
   */
  readonly decisionSource: DecisionSource | null;
  readonly result: GameResult;
  readonly players: Readonly<Record<PlayerId, PublicPlayerInfo>>;
  readonly objects: Readonly<Record<ObjectId, VisibleObject>>;
  readonly zones: {
    readonly battlefield: readonly ObjectId[];
    readonly stack: readonly ObjectId[];
    /** Single shared zones — each object's `owner` says whose card it is. */
    readonly exile: readonly ObjectId[];
    /** Whose card each exiled id is, for every one of them: whose a
     * face-down card is stays public (rule 406.3 hides only its face), and
     * a hidden one has no entry in `objects` to say so. */
    readonly exileOwners: Readonly<Record<ObjectId, PlayerId>>;
    readonly command: readonly ObjectId[];
    /** Every hand's ids are here regardless of whose it is (so an opponent's
     * hand can render as N face-down cards) — but `objects` below only
     * carries the identity of your own hand's cards, and of any card that
     * was revealed. */
    readonly hands: Readonly<Record<PlayerId, readonly ObjectId[]>>;
    readonly graveyards: Readonly<Record<PlayerId, readonly ObjectId[]>>;
  };
  /** Each player's top library card, if some permanent they control makes it
   * public knowledge (e.g. Oracle of Mul Daya) — `null` otherwise. The
   * viewer's own also when a permanent of theirs lets them look at it any
   * time (Glarb, Calamity's Augur), which no one else's view shows. */
  readonly revealedLibraryTop: Readonly<Record<PlayerId, ObjectId | null>>;
  /** The day/night designation (rule 726 — ROADMAP Phase 10b), or `null` until
   * a card first makes it day or night. */
  readonly dayNight: "day" | "night" | null;
  /** The monarch (rule 720 — ROADMAP Phase 10), or `null`. */
  readonly monarch: PlayerId | null;
  /** Emblems in the game (rule 114 — ROADMAP Phase 10), owner + text only. */
  /** `source` is the name of the card that created the emblem, or `null`. */
  readonly emblems: readonly { readonly owner: PlayerId; readonly text: string; readonly source: string | null }[];
  readonly events: readonly GameEvent[];
  /** When each object was public knowledge, and as what (`PublicStint`): how
   * the history names an object in a line from a time it was known, after it
   * has gone somewhere this viewer can't see. */
  readonly publicStints: Readonly<Record<string, readonly PublicStint[]>>;
}

export interface ViewOptions {
  /**
   * What `cardId` costs the viewer right now, or `null` when it is the
   * printed cost. Supplied by `Game.viewFor`, because working it out needs
   * commander tax and the battlefield's cost-modification statics — a
   * capability handed in rather than logic duplicated here, the same shape
   * `DecisionReadCtx` and `ManaPlanningView` use.
   */
  readonly effectiveCost?: (cardId: ObjectId) => string | null;
  /** How many lands `player` may play this turn. Supplied by `Game.viewFor`
   * for the same reason: an extra land drop is a static whose condition only
   * `Game` can evaluate. Without it, the rules' base limit plus any one-shot
   * extra land drops. */
  readonly maxLands?: (player: PlayerId) => number;
}

/**
 * The card behind the pending decision — see `PlayerView.decisionSource`.
 *
 * A decision variant that names its own `source` is preferred over
 * `state.decisionSource`: it's exact, and it's still right for the decisions
 * raised outside a resolution (a shock land's "pay 2 life?" is asked as the
 * land enters, not as anything resolves).
 */
function decisionSourceFor(state: GameState): DecisionSource | null {
  const awaiting = state.awaiting;
  if (awaiting === null || !decisionHasSource(awaiting)) return null;
  const own = "source" in awaiting ? awaiting.source : undefined;
  if (own !== undefined) {
    const object = state.objects[own];
    if (object !== undefined) {
      return { object: own, cardName: printedCardName(object) };
    }
  }
  return state.decisionSource;
}

/** See `VisibleObject.chosen`. Read off a permanent only: both fields are
 * cleared on a zone change, but a card on its way in can carry a stale one. */
function chosenOf(object: GameObject): string | null {
  if (object.zone !== "battlefield") return null;
  return object.chosenOnEnter ?? object.chosenCreatureType ?? null;
}

function visible(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): VisibleObject {
  const object = state.objects[id];
  const printedName = printedCardName(object);
  const def = registry.get(printedName);
  const chosen = chosenOf(object);
  const computed = computeCharacteristics(state, registry, id);
  // The printing this card's *owner* brought (see `PlayerState.printings`)
  // stands in for the pool's default illustration. Keyed by the card's front
  // face, which is the name a decklist (and so the printings map) uses — a
  // turned-over permanent is still the same physical card.
  const printing = state.players[object.owner]?.printings[def.faces?.[0] ?? printedName];
  // Whether the up face is the card's *second printed image* — a
  // transforming DFC turned over, or an MDFC's other face. An adventure has
  // the same two-entry `faces` shape but only one printed image, so it is
  // never true there. The client needs this to ask Scryfall for the right
  // side of a chosen printing (`face=back`), which a card id alone can't
  // say; it can't work it out itself without the card registry.
  // A split card's halves share its one image too, and an omen card's.
  const faceIsBack =
    (object.faces === undefined ? 0 : (object.face ?? 0)) > 0 && !def.adventure && !def.omen && !def.split;
  // Computed, not printed — a man-land currently animated (layer 4) is a
  // creature and should carry a P/T; a land again next turn and it won't.
  const isCreature = computed.types.includes("creature");
  // A permanent that lost its abilities (layer 6 — Turn to Frog) shows no
  // rules text; its keywords are already gone from `computed`.
  const onBattlefield = object.zone === "battlefield";
  const lostAbilities =
    onBattlefield && object.modifiers.some((m) => m.loseAbilities === true);
  // Layer 3 (text-change — Artificial Evolution): rewrite the displayed word
  // so the card reads the way it now functions.
  let text = lostAbilities ? "" : def.text;
  if (onBattlefield && text.length > 0) {
    for (const m of object.modifiers) {
      if (m.textSubstitution) {
        text = text.split(m.textSubstitution.from).join(m.textSubstitution.to);
      }
    }
  }
  // Abilities an effect gave it read with its own: a copy exception's "and
  // it has '…'" (rule 707.9b — Brenard's Food Golems), a one-shot's
  // granted trigger. Only those it still has (rule 613.7).
  if (onBattlefield) {
    // Its basic land types' mana abilities (rule 305.6), written as a typed
    // land's reminder is: a type it gained adds its line, and once a printed
    // type has gone (rule 305.7) the printed line gives way to one for the
    // types it has now.
    const lapsed = def.activated.some((_, i) => inactiveStandIn(state, registry, object, i));
    if (lapsed) {
      text = text
        .split("\n")
        .filter((line) => !/^\(?\{T\}: Add [^()]*\.\)?$/.test(line))
        .join("\n");
    }
    const extra = lapsed
      ? intrinsicManaColors(state, registry, object)
      : extraIntrinsicManaColors(state, registry, object);
    if (extra.length > 0) {
      const symbols = extra.map((c) => `{${c}}`);
      const list =
        symbols.length <= 2 ? symbols.join(" or ") : `${symbols.slice(0, -1).join(", ")}, or ${symbols.at(-1)}`;
      const reminder = `({T}: Add ${list}.)`;
      text = text.length > 0 ? `${text}\n${reminder}` : reminder;
    }
    const lostAt = abilitiesLostAt(object);
    for (const m of object.modifiers) {
      if (!modifierGrantApplies(m, lostAt)) continue;
      for (const ability of [...(m.grantsActivated ?? []), ...(m.grantsTriggered ?? [])]) {
        text = text.length > 0 ? `${text}\n${ability.text}` : ability.text;
      }
    }
  }
  return {
    id: object.id,
    // The permanent's true identity ("Clone"); `copyOf` carries the copied
    // card's name (rule 707) and the client renders that face.
    cardName: object.cardName,
    copyOf: object.copyOf,
    faceName: faceName(object),
    ...(nameOf(object) !== printedCardName(object) ? { name: nameOf(object) } : {}),
    faces: object.faces === undefined ? null : [...object.faces],
    art: printing ?? def.art,
    faceIsBack,
    owner: object.owner,
    controller: object.controller,
    zone: object.zone,
    manaCost: manaCostOverride(object) !== undefined ? (manaCostOverride(object) ?? null) : def.manaCost,
    text,
    types: computed.types,
    supertypes: supertypesOf(registry, object),
    // The subtypes a type line shows: a changeling's "every creature type"
    // is an engine marker (`subtypes.ts`), not a word on the card — its
    // changeling keyword says so instead.
    subtypes: withoutTypeMarkers(computed.subtypes),
    power: isCreature ? computed.power : null,
    toughness: isCreature ? computed.toughness : null,
    // On the battlefield, its loyalty counters; anywhere else, the loyalty
    // printed on the card (rule 306.5a), as the card shows it in a hand.
    loyalty: computed.types.includes("planeswalker")
      ? object.zone === "battlefield"
        ? (object.counters.loyalty ?? 0)
        : def.loyalty
      : null,
    keywords: [...computed.keywords],
    // Including a turn-wide "can't block this turn" rule it falls under.
    restrictions: [...restrictionsOf(state, registry, id)],
    colors: [...computed.colors],
    tapped: object.tapped,
    damageMarked: object.damageMarked,
    regenerationShields: object.regenerationShields ?? 0,
    ...(chosen !== null ? { chosen } : {}),
    counters: { ...object.counters },
    summoningSick: object.summoningSick,
    attacking: object.attacking,
    blocking: object.blocking,
    blocked: object.attacking !== null && object.blocked,
    kind: object.kind,
    sourceObjectId: object.sourceObjectId,
    abilityIndex: object.abilityIndex,
    // A hole is a skipped optional slot; the view shows only real targets.
    targets:
      object.targets === null
        ? null
        : object.targets.filter((t): t is TargetRef => t !== undefined),
    xValue: object.xValue,
    isToken: object.isToken,
    stackCount: object.stackCount ?? null,
    isCopy: object.isCopy ?? false,
    suspended: object.suspended ?? false,
    foretold: object.foretold ?? false,
    attachedTo: object.attachedTo,
    isCommander: object.isCommander,
    goadedBy: [...goadersOf(state, registry, id)],
    suspected: object.zone === "battlefield" && object.suspectedAt !== undefined,
  };
}

/** One card to load the art of ahead of time — see {@link artManifest}. */
export interface ArtManifestEntry {
  /** The front face's name: what a tile asks Scryfall for. */
  readonly name: string;
  /** Its owner's chosen printing, or the pool's pinned art — a tile's `art`. */
  readonly art?: string;
}

/**
 * Every card every player brought — library, hand, command zone, wherever
 * it is now — as the art a tile would ask for, once each. For a client to
 * load quietly at the start of a game so no card's art waits on the network
 * the first time it's seen (the server's `artManifest`). Not redacted: it
 * names the cards in every deck, which is accepted for games among friends.
 * Tokens aren't anyone's deck, and are left out.
 */
export function artManifest(state: GameState, registry: CardRegistry): ArtManifestEntry[] {
  const seen = new Set<string>();
  const out: ArtManifestEntry[] = [];
  for (const object of Object.values(state.objects)) {
    if (object.kind !== "card" || object.isToken) continue;
    const printed = printedCardName(object);
    if (!registry.has(printed)) continue;
    const def = registry.get(printed);
    const name = def.faces?.[0] ?? printed;
    const art = state.players[object.owner]?.printings[name] ?? def.art;
    const key = `${name} ${art ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(art === undefined || art === null ? { name } : { name, art });
  }
  return out;
}

/**
 * Each battlefield permanent's linked exile — see `VisibleObject.holding`.
 * A link counts only while its permanent is on the battlefield: an O-Ring's
 * `exiledBy`, or an impulse permission's source (`source`, and only while
 * it's still the same object — rule 400.7; or a `while-source` expiry).
 */
function exileHoldings(state: GameState): Map<ObjectId, ObjectId[]> {
  const out = new Map<ObjectId, ObjectId[]>();
  const onBattlefield = (id: ObjectId): boolean => state.objects[id]?.zone === "battlefield";
  for (const id of state.zones.shared.exile) {
    const object = state.objects[id];
    if (object === undefined) continue;
    const linked = object.impulse?.source;
    const holder =
      object.exiledBy !== undefined && onBattlefield(object.exiledBy)
        ? object.exiledBy
        : linked !== undefined &&
            onBattlefield(linked.id) &&
            (state.objects[linked.id].zoneChangeCount ?? 0) === linked.zoneChangeCount
          ? linked.id
          : object.impulse?.expiry.kind === "while-source" && onBattlefield(object.impulse.expiry.source)
            ? object.impulse.expiry.source
            : undefined;
    if (holder === undefined) continue;
    const list = out.get(holder);
    if (list === undefined) out.set(holder, [id]);
    else list.push(id);
  }
  return out;
}

export function viewFor(
  state: GameState,
  registry: CardRegistry,
  viewer: PlayerId,
  options: ViewOptions = {},
): PlayerView {
  // A pure read over one settled state, computing characteristics for every
  // visible object — cache them for the duration.
  return withComputedCache(() => viewForUncached(state, registry, viewer, options));
}

function viewForUncached(
  state: GameState,
  registry: CardRegistry,
  viewer: PlayerId,
  options: ViewOptions = {},
): PlayerView {
  const players: Record<PlayerId, PublicPlayerInfo> = {};
  const hands: Record<PlayerId, readonly ObjectId[]> = {};
  const graveyards: Record<PlayerId, readonly ObjectId[]> = {};
  const revealedLibraryTop: Record<PlayerId, ObjectId | null> = {};
  const visibleIds: ObjectId[] = [
    ...state.zones.shared.battlefield,
    ...state.zones.shared.stack,
    // A foretold card is face-down in exile — its identity is hidden from
    // everyone but its owner (ROADMAP Phase 6b); a card exiled face down by
    // an effect, from everyone but the players it lets look (rule 406.3 —
    // Edward Kenway). The id still appears in the `exile` zone list, so a
    // client renders a face-down back for it.
    ...state.zones.shared.exile.filter((id) => {
      const object = state.objects[id];
      if (object?.exiledFaceDown !== undefined) return object.exiledFaceDown.lookers.includes(viewer);
      return object?.foretold !== true || object.owner === viewer;
    }),
    ...state.zones.shared.command,
  ];
  // A pending "look at N cards, choose some" decision reveals its candidates
  // to the choosing player only — this is the only place library cards ever
  // become visible (graveyard candidates are already public via `graveyards`
  // below, but pushing them again here is harmless).
  if (state.awaiting?.kind === "choose-from-zone" && state.awaiting.player === viewer) {
    visibleIds.push(...state.awaiting.ids);
  }
  // A scry / surveil reveals the looked-at top cards to that player only.
  if (state.awaiting?.kind === "scry" && state.awaiting.player === viewer) {
    visibleIds.push(...state.awaiting.cards);
  }
  // So does a `cast-now` that has its player look at the top of their
  // library to choose a spell from among (Velomachus Lorehold).
  if (state.awaiting?.kind === "cast-now" && state.awaiting.player === viewer) {
    visibleIds.push(...(state.awaiting.looked ?? []));
  }
  // A real reveal (rule 701.16) is to *everyone*, which is the whole point —
  // this is the only path that puts a card another player owns, and that is
  // sitting in a hidden zone, into your view. Turn-scoped, so it stops being
  // a window into their hand once the turn is over (see `revealedThisTurn`).
  visibleIds.push(...state.revealedThisTurn);

  for (const player of state.turnOrder) {
    const zones = state.zones.perPlayer[player];
    const playerState = state.players[player];
    players[player] = {
      id: player,
      life: playerState.life,
      manaPool: poolCounts(playerState.manaPool),
      handSize: zones.hand.length,
      librarySize: zones.library.length,
      graveyardSize: zones.graveyard.length,
      landsPlayedThisTurn: playerState.landsPlayedThisTurn,
      maxLandsThisTurn:
        options.maxLands?.(player) ??
        state.rules.maxLandsPerTurn + (playerState.extraLandsThisTurn ?? 0),
      hasLost: playerState.hasLost,
      lossReason: playerState.lossReason,
      commanderDamageTaken: Object.entries(playerState.commanderDamageTaken)
        .filter(([id, amount]) => amount > 0 && state.objects[id as ObjectId] !== undefined)
        .map(([id, amount]): CommanderDamage => {
          const commander = state.objects[id as ObjectId];
          const name = printedCardName(commander);
          const def = registry.get(name);
          return {
            commander: id as ObjectId,
            name: def.faces?.[0] ?? name,
            owner: commander.owner,
            art: state.players[commander.owner]?.printings[def.faces?.[0] ?? name] ?? def.art,
            amount,
          };
        }),
      commanderCastCounts: { ...playerState.commanderCastCounts },
      energy: playerState.energy,
      counters: { ...playerState.counters },
    };
    graveyards[player] = [...zones.graveyard];
    visibleIds.push(...zones.graveyard);

    const revealsTop = state.zones.shared.battlefield.some((id) => {
      const object = state.objects[id];
      return object.controller === player && registry.get(printedCardName(object)).revealsOwnLibraryTop;
    });
    // "You may look at the top card of your library any time" (Glarb,
    // Calamity's Augur — rule 401.5): shown in its owner's own view only.
    const looksAtTop =
      player === viewer &&
      state.zones.shared.battlefield.some((id) => {
        const object = state.objects[id];
        return (
          object.controller === player &&
          !hasLostAbilities(object) &&
          registry.get(printedCardName(object)).looksAtOwnLibraryTop
        );
      });
    const topCard = revealsTop || looksAtTop ? (zones.library[0] ?? null) : null;
    revealedLibraryTop[player] = topCard;
    if (topCard !== null) visibleIds.push(topCard);

    // The *ids* are public — how many cards, and which slot is which — so a
    // client can render a face-down back per card (and later swap one to its
    // real face if something reveals it, e.g. Gitaxian Probe). Only the
    // *identity* (the object's entry in `objects` below) stays hidden unless
    // it's your own hand or the card was actually revealed.
    hands[player] = [...zones.hand];
    if (player === viewer) {
      visibleIds.push(...zones.hand);
    }
  }

  const holdings = exileHoldings(state);
  const objects: Record<ObjectId, VisibleObject> = {};
  // The viewer's own castable-from zones. A modified cost is only meaningful
  // (and only theirs to know) for cards they could actually cast.
  const ownCastable = new Set<ObjectId>([
    ...state.zones.perPlayer[viewer].hand,
    ...state.zones.shared.command.filter((id) => state.objects[id]?.owner === viewer),
  ]);
  for (const id of visibleIds) {
    if (state.objects[id] !== undefined) {
      const base = visible(state, registry, id);
      const cost =
        options.effectiveCost !== undefined && ownCastable.has(id)
          ? options.effectiveCost(id)
          : null;
      const held = holdings.get(id);
      const withHeld = held === undefined ? base : { ...base, holding: held };
      objects[id] = cost === null ? withHeld : { ...withHeld, effectiveManaCost: cost };
    }
  }

  return {
    turnOrder: [...state.turnOrder],
    startingPlayer: state.startingPlayer,
    activePlayer: activePlayerOf(state),
    turn: { ...state.turn },
    priority: { ...state.priority, passed: [...state.priority.passed] },
    // Which hand cards may pay a "discard a creature card" cost says what
    // kind of card each is: only the player asked sees it.
    awaiting:
      state.awaiting?.kind === "discard" && state.awaiting.eligible !== undefined && state.awaiting.player !== viewer
        ? (({ eligible: _hidden, ...rest }) => rest)(state.awaiting)
        : // What a `cast-now` offers can be cards in its player's hand or
          // library: to anyone else, only that they're deciding.
          state.awaiting?.kind === "cast-now" && state.awaiting.player !== viewer
          ? (({ looked: _looked, ...rest }) => ({ ...rest, cards: [], offers: [] }))(state.awaiting)
          : // Which hand cards a reveal land could show says what they are,
            // until one is actually revealed.
            state.awaiting?.kind === "reveal-for-untapped" && state.awaiting.player !== viewer
            ? { ...state.awaiting, options: [] }
            : // A search's set rule tags each library card with its land
              // types: only the searcher sees them.
              state.awaiting?.kind === "choose-from-zone" &&
                state.awaiting.together !== undefined &&
                state.awaiting.player !== viewer
              ? { ...state.awaiting, together: { ...state.awaiting.together, tags: {} } }
              : state.awaiting,
    decisionSource: decisionSourceFor(state),
    result: { ...state.result },
    players,
    objects,
    zones: {
      battlefield: [...state.zones.shared.battlefield],
      stack: [...state.zones.shared.stack],
      exile: [...state.zones.shared.exile],
      exileOwners: Object.fromEntries(
        state.zones.shared.exile.flatMap((id) => {
          const owner = state.objects[id]?.owner;
          return owner === undefined ? [] : [[id, owner]];
        }),
      ),
      command: [...state.zones.shared.command],
      hands,
      graveyards,
    },
    revealedLibraryTop,
    dayNight: state.dayNight,
    monarch: state.monarch,
    emblems: state.emblems.map((e) => ({ owner: e.owner, text: e.text, source: e.sourceName ?? null })),
    events: state.eventLog,
    publicStints: state.publicStints ?? {},
  };
}
