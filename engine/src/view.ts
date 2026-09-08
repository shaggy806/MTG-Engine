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

import type { CardRegistry, CardType, CombatRestriction, Keyword } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import type { GameEvent } from "./events.js";
import type { Color, ManaPool } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type {
  AwaitingDecision,
  GameResult,
  GameState,
  PriorityState,
  TurnState,
  ZoneType,
} from "./state.js";
import { activePlayerOf, faceName, printedCardName } from "./state.js";
import type { TargetRef } from "./target.js";

export interface PublicPlayerInfo {
  readonly id: PlayerId;
  readonly life: number;
  readonly manaPool: ManaPool;
  readonly handSize: number;
  readonly librarySize: number;
  readonly graveyardSize: number;
  readonly landsPlayedThisTurn: number;
  readonly maxHandSize: number;
  readonly hasLost: boolean;
  readonly lossReason: string | null;
  /** Combat damage taken from each opponent's commander so far this game. */
  readonly commanderDamageTaken: Readonly<Record<PlayerId, number>>;
  /** Times this player has cast each commander (by name) from the command
   * zone — each adds {2} generic to that commander's cost next time (rule
   * 903.8). */
  readonly commanderCastCounts: Readonly<Record<string, number>>;
}

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
  readonly faces: readonly string[] | null;
  readonly owner: PlayerId;
  readonly controller: PlayerId;
  readonly zone: ZoneType;
  readonly manaCost: string | null;
  readonly text: string;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  /** Computed power/toughness; `null` for objects that are not creatures. */
  readonly power: number | null;
  readonly toughness: number | null;
  /** Current loyalty (`counters.loyalty`) for a planeswalker; `null` otherwise. */
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
  readonly counters: Readonly<Record<string, number>>;
  readonly summoningSick: boolean;
  /** A player, or an opponent's planeswalker (an `ObjectId`), or `null`. */
  readonly attacking: PlayerId | ObjectId | null;
  readonly blocking: ObjectId | null;
  readonly blockedBy: readonly ObjectId[];
  readonly blocked: boolean;
  readonly kind: "card" | "ability";
  readonly abilityKind: "activated" | "triggered" | "chapter" | null;
  readonly sourceObjectId: ObjectId | null;
  readonly abilityIndex: number | null;
  readonly targets: readonly TargetRef[] | null;
  /** The value chosen for `{X}` if this is an X spell/permanent, else `null`. */
  readonly xValue: number | null;
  readonly isToken: boolean;
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
}

export interface PlayerView {
  readonly viewer: PlayerId;
  readonly turnOrder: readonly PlayerId[];
  /** Who the "highroll" (or a configured `startingPlayer`) chose to go
   * first — fixed for the life of the game, unlike `activePlayer`. */
  readonly startingPlayer: PlayerId;
  readonly activePlayer: PlayerId;
  readonly turn: TurnState;
  readonly priority: PriorityState;
  readonly awaiting: AwaitingDecision | null;
  readonly result: GameResult;
  readonly players: Readonly<Record<PlayerId, PublicPlayerInfo>>;
  readonly objects: Readonly<Record<ObjectId, VisibleObject>>;
  readonly zones: {
    readonly battlefield: readonly ObjectId[];
    readonly stack: readonly ObjectId[];
    /** Single shared zones — each object's `owner` says whose card it is. */
    readonly exile: readonly ObjectId[];
    readonly command: readonly ObjectId[];
    /** Every hand's ids are here regardless of whose it is (so an opponent's
     * hand can render as N face-down cards) — but `objects` below only
     * carries the identity of your own hand's cards, unless `revealAll`. */
    readonly hands: Readonly<Record<PlayerId, readonly ObjectId[]>>;
    readonly graveyards: Readonly<Record<PlayerId, readonly ObjectId[]>>;
  };
  /** Each player's top library card, if some permanent they control makes it
   * public knowledge (e.g. Oracle of Mul Daya) — `null` otherwise. */
  readonly revealedLibraryTop: Readonly<Record<PlayerId, ObjectId | null>>;
  /** The day/night designation (rule 726 — ROADMAP Phase 10b), or `null` until
   * a card first makes it day or night. */
  readonly dayNight: "day" | "night" | null;
  readonly events: readonly GameEvent[];
}

export interface ViewOptions {
  /** Reveal every hand (for a hot-seat spectator or debugging). */
  readonly revealAll?: boolean;
}

function visible(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): VisibleObject {
  const object = state.objects[id];
  const def = registry.get(printedCardName(object));
  const computed = computeCharacteristics(state, registry, id);
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
  return {
    id: object.id,
    // The permanent's true identity ("Clone"); `copyOf` carries the copied
    // card's name (rule 707) and the client renders that face.
    cardName: object.cardName,
    copyOf: object.copyOf,
    faceName: faceName(object),
    faces: object.faces === undefined ? null : [...object.faces],
    owner: object.owner,
    controller: object.controller,
    zone: object.zone,
    manaCost: def.manaCost,
    text,
    types: computed.types,
    subtypes: computed.subtypes,
    power: isCreature ? computed.power : null,
    toughness: isCreature ? computed.toughness : null,
    loyalty: computed.types.includes("planeswalker")
      ? (object.counters.loyalty ?? 0)
      : null,
    keywords: [...computed.keywords],
    restrictions: [...computed.restrictions],
    colors: [...computed.colors],
    tapped: object.tapped,
    damageMarked: object.damageMarked,
    counters: { ...object.counters },
    summoningSick: object.summoningSick,
    attacking: object.attacking,
    blocking: object.blocking,
    blockedBy: [...object.blockedBy],
    blocked: object.blocked,
    kind: object.kind,
    abilityKind: object.abilityKind,
    sourceObjectId: object.sourceObjectId,
    abilityIndex: object.abilityIndex,
    targets: object.targets === null ? null : [...object.targets],
    xValue: object.xValue,
    isToken: object.isToken,
    isCopy: object.isCopy ?? false,
    suspended: object.suspended ?? false,
    foretold: object.foretold ?? false,
    attachedTo: object.attachedTo,
    isCommander: object.isCommander,
  };
}

export function viewFor(
  state: GameState,
  registry: CardRegistry,
  viewer: PlayerId,
  options: ViewOptions = {},
): PlayerView {
  const revealAll = options.revealAll ?? false;

  const players: Record<PlayerId, PublicPlayerInfo> = {};
  const hands: Record<PlayerId, readonly ObjectId[]> = {};
  const graveyards: Record<PlayerId, readonly ObjectId[]> = {};
  const revealedLibraryTop: Record<PlayerId, ObjectId | null> = {};
  const visibleIds: ObjectId[] = [
    ...state.zones.shared.battlefield,
    ...state.zones.shared.stack,
    // A foretold card is face-down in exile — its identity is hidden from
    // everyone but its owner (ROADMAP Phase 6b). The id still appears in the
    // `exile` zone list, so a client renders a face-down back for it.
    ...state.zones.shared.exile.filter((id) => {
      const object = state.objects[id];
      return revealAll || object?.foretold !== true || object.owner === viewer;
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

  for (const player of state.turnOrder) {
    const zones = state.zones.perPlayer[player];
    const playerState = state.players[player];
    players[player] = {
      id: player,
      life: playerState.life,
      manaPool: { ...playerState.manaPool },
      handSize: zones.hand.length,
      librarySize: zones.library.length,
      graveyardSize: zones.graveyard.length,
      landsPlayedThisTurn: playerState.landsPlayedThisTurn,
      maxHandSize: playerState.maxHandSize,
      hasLost: playerState.hasLost,
      lossReason: playerState.lossReason,
      commanderDamageTaken: { ...playerState.commanderDamageTaken },
      commanderCastCounts: { ...playerState.commanderCastCounts },
    };
    graveyards[player] = [...zones.graveyard];
    visibleIds.push(...zones.graveyard);

    const revealsTop = state.zones.shared.battlefield.some((id) => {
      const object = state.objects[id];
      return object.controller === player && registry.get(printedCardName(object)).revealsOwnLibraryTop;
    });
    const topCard = revealsTop ? (zones.library[0] ?? null) : null;
    revealedLibraryTop[player] = topCard;
    if (topCard !== null) visibleIds.push(topCard);

    // The *ids* are public — how many cards, and which slot is which — so a
    // client can render a face-down back per card (and later swap one to its
    // real face if something reveals it, e.g. Gitaxian Probe). Only the
    // *identity* (the object's entry in `objects` below) stays hidden unless
    // it's your own hand, `revealAll`, or the card was actually revealed.
    hands[player] = [...zones.hand];
    if (revealAll || player === viewer) {
      visibleIds.push(...zones.hand);
    }
  }

  const objects: Record<ObjectId, VisibleObject> = {};
  for (const id of visibleIds) {
    if (state.objects[id] !== undefined) {
      objects[id] = visible(state, registry, id);
    }
  }

  return {
    viewer,
    turnOrder: [...state.turnOrder],
    startingPlayer: state.startingPlayer,
    activePlayer: activePlayerOf(state),
    turn: { ...state.turn },
    priority: { ...state.priority, passed: [...state.priority.passed] },
    awaiting: state.awaiting,
    result: { ...state.result },
    players,
    objects,
    zones: {
      battlefield: [...state.zones.shared.battlefield],
      stack: [...state.zones.shared.stack],
      exile: [...state.zones.shared.exile],
      command: [...state.zones.shared.command],
      hands,
      graveyards,
    },
    revealedLibraryTop,
    dayNight: state.dayNight,
    events: state.eventLog,
  };
}
