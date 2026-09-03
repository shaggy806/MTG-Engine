/**
 * A redacted, self-contained snapshot of the game from one player's seat.
 *
 * Hidden information stays hidden: you see your own hand, but only a count of
 * the opponent's, and library contents are never exposed. Battlefield and stack
 * objects carry their **computed** characteristics, so a client never needs the
 * card registry or the layer system to render a board.
 */

import type { CardRegistry, CardType, Keyword } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import type { GameEvent } from "./events.js";
import type { ManaPool } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type {
  AwaitingDecision,
  GameResult,
  GameState,
  PriorityState,
  TurnState,
  ZoneType,
} from "./state.js";
import { activePlayerOf } from "./state.js";
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
}

export interface VisibleObject {
  readonly id: ObjectId;
  readonly cardName: string;
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
  readonly keywords: readonly Keyword[];
  readonly tapped: boolean;
  readonly damageMarked: number;
  readonly counters: Readonly<Record<string, number>>;
  readonly summoningSick: boolean;
  readonly attacking: PlayerId | null;
  readonly blocking: ObjectId | null;
  readonly blockedBy: readonly ObjectId[];
  readonly blocked: boolean;
  readonly kind: "card" | "ability";
  readonly abilityKind: "activated" | "triggered" | null;
  readonly sourceObjectId: ObjectId | null;
  readonly abilityIndex: number | null;
  readonly targets: readonly TargetRef[] | null;
}

export interface PlayerView {
  readonly viewer: PlayerId;
  readonly turnOrder: readonly PlayerId[];
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
    /** Only the viewer's hand is populated unless `revealAll` was set. */
    readonly hands: Readonly<Record<PlayerId, readonly ObjectId[]>>;
    readonly graveyards: Readonly<Record<PlayerId, readonly ObjectId[]>>;
  };
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
  const def = registry.get(object.cardName);
  const computed = computeCharacteristics(state, registry, id);
  const isCreature = def.types.includes("creature");
  return {
    id: object.id,
    cardName: object.cardName,
    owner: object.owner,
    controller: object.controller,
    zone: object.zone,
    manaCost: def.manaCost,
    text: def.text,
    types: computed.types,
    subtypes: computed.subtypes,
    power: isCreature ? computed.power : null,
    toughness: isCreature ? computed.toughness : null,
    keywords: [...computed.keywords],
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
  const visibleIds: ObjectId[] = [
    ...state.zones.shared.battlefield,
    ...state.zones.shared.stack,
    ...state.zones.shared.exile,
  ];

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
    };
    graveyards[player] = [...zones.graveyard];
    visibleIds.push(...zones.graveyard);

    if (revealAll || player === viewer) {
      hands[player] = [...zones.hand];
      visibleIds.push(...zones.hand);
    } else {
      hands[player] = [];
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
      hands,
      graveyards,
    },
    events: state.eventLog,
  };
}
