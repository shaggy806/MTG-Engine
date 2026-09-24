import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { defineCard } from "../cards/define.js";
import { ward } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { HeuristicBotController, ScriptedController } from "../controller.js";
import { randomAnswerFor } from "../decisions/registry.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const boltA = (game: Game, target: TargetLike): void => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: named(game, game.handOf(A), "Lightning Bolt"),
    targets: [target],
  });
};
type TargetLike =
  | { kind: "object"; object: ObjectId }
  | { kind: "player"; player: PlayerId };

describe("Ward — Miirym, Sentinel Wyrm (Ward {2})", () => {
  it("taxes an opponent's targeted spell when they choose to pay", () => {
    const { game, a } = mkGame(["Lightning Bolt"]);
    a.chooseModesFn = () => [0];
    game.advanceUntil(toPrecombat);
    const miirym = spawn(game, "Miirym, Sentinel Wyrm", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", A);

    boltA(game, { kind: "object", object: miirym });
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid").some((e) => e.object === miirym)).toBe(true);
    expect(game.state.objects[miirym].damageMarked).toBe(3); // the Bolt still hit
    // {R} for the Bolt + {2} for ward = all three Mountains tapped.
    expect(
      game.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Mountain" && game.state.objects[id].tapped,
      ).length,
    ).toBe(3);
  });

  it("counters an opponent's spell when they can't pay the ward", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const miirym = spawn(game, "Miirym, Sentinel Wyrm", B);
    spawn(game, "Mountain", A); // only enough for the Bolt itself

    boltA(game, { kind: "object", object: miirym });
    game.advanceUntil(settled);

    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
    expect(game.state.objects[miirym].damageMarked).toBe(0);
    expect(
      game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Lightning Bolt"),
    ).toBe(true);
  });

  it("does not tax the controller's own spell", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const miirym = spawn(game, "Miirym, Sentinel Wyrm", A); // Alice's own
    spawn(game, "Mountain", A);

    boltA(game, { kind: "object", object: miirym });
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid")).toHaveLength(0);
    expect(game.state.objects[miirym].damageMarked).toBe(3);
  });

  it("also protects against a targeted ability", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const miirym = spawn(game, "Miirym, Sentinel Wyrm", B);
    const tim = spawn(game, "Prodigal Sorcerer", A); // {T}: deal 1 to any target
    // no spare mana for Alice — the ward can't be paid

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tim,
      abilityIndex: 0,
      targets: [{ kind: "object", object: miirym }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[miirym].damageMarked).toBe(0);
    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
  });
});

// --- Ward as a triggered ability (rule 702.21) ------------------------------

const C = asPlayerId("carol");

const bear = (name: string, triggered: ReturnType<typeof ward>[], extra = {}) =>
  defineCard({
    name,
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Bear"],
    power: 2,
    toughness: 5,
    text: triggered.map((t) => t.text).join("\n"),
    triggered,
    ...extra,
  });

const TEST_CARDS = [
  bear("Life Ward Bear", [ward({ payLife: 2 })]),
  bear("Compound Ward Bear", [ward({ mana: "{2}", payLife: 2 })]),
  bear("Sacrifice Ward Bear", [
    ward({ sacrifice: { filter: { type: "artifact" }, text: "Sacrifice an artifact" } }),
  ]),
  bear("Discard Ward Bear", [ward({ discard: 1 })]),
  bear("Treasure Ward Bear", [
    ward({ mana: "{1}", sacrifice: { filter: { type: "artifact" }, text: "Sacrifice an artifact" } }),
  ]),
  bear("Double Ward Bear", [ward({ mana: "{1}" }), ward({ mana: "{1}" })]),
  defineCard({
    name: "Ward Test Pinger",
    manaCost: "{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Goblin"],
    power: 1,
    toughness: 1,
    text: "When this creature enters, it deals 1 damage to target creature an opponent controls.",
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: ["creature-an-opponent-controls"],
        effect: { kind: "damage", amount: 1, target: 0 },
        resolve: null,
        text: "When this creature enters, it deals 1 damage to target creature an opponent controls.",
      },
    ],
  }),
  defineCard({
    name: "Uncounterable Shock",
    manaCost: "{R}",
    colors: ["R"],
    types: ["instant"],
    text: "This spell can't be countered.\nUncounterable Shock deals 2 damage to any target.",
    targets: ["any-target"],
    effect: { kind: "damage", amount: 2, target: 0 },
    cantBeCountered: true,
  }),
  defineCard({
    name: "Goblin Warder",
    manaCost: "{1}{R}",
    colors: ["R"],
    types: ["enchantment"],
    text: "Goblins you control have ward {2}.",
    static: [
      {
        affects: { scope: "creatures-you-control", subtype: "Goblin" },
        grantsTriggered: [ward({ mana: "{2}" })],
        text: "Goblins you control have ward {2}.",
      },
    ],
  }),
];

const mkTable = (
  opts: { hand?: readonly string[]; players?: 2 | 3; bot?: boolean } = {},
) => {
  const registry = createDefaultRegistry();
  for (const card of TEST_CARDS) registry.register(card);
  const players = opts.players === 3 ? [A, B, C] : [A, B];
  const controllers = Object.fromEntries(
    players.map((p) => [
      p,
      opts.bot === true && p === A
        ? new HeuristicBotController(p, registry)
        : new ScriptedController(p),
    ]),
  );
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({
      player: p,
      cards: pad(p === A ? (opts.hand ?? ["Lightning Bolt"]) : []),
    })),
  });
  game.advanceUntil(toPrecombat);
  return {
    game,
    a: controllers[A] as ScriptedController,
    registry,
  };
};

const mountains = (game: Game, n: number, who: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn("Mountain", who, "battlefield"));

const castAt = (game: Game, card: string, target: ObjectId, player: PlayerId = A): ObjectId => {
  const id = named(game, game.handOf(player), card);
  game.dispatch({
    type: "cast-spell",
    player,
    card: id,
    targets: [{ kind: "object", object: target }],
  });
  return id;
};

const wardOffer = (game: Game, player: PlayerId) =>
  game
    .legalActions(player)
    .find(
      (a): a is Extract<LegalAction, { kind: "choose-modes" }> =>
        a.kind === "choose-modes" && a.ward !== undefined,
    );

/** Settled, with no fired trigger still waiting to go on the stack. */
const drained = (s: GameState): boolean => settled(s) && s.pendingTriggers.length === 0;

/** Run until someone is asked about ward, or the stack settles. */
const toWardChoice = (game: Game): void =>
  game.advanceUntil(
    (s) => (s.awaiting?.kind === "choose-modes" && s.awaiting.ward !== undefined) || settled(s),
  );

describe("Ward as a triggered ability (rule 702.21)", () => {
  it("goes on the stack above the targeting spell, controlled by the warded permanent's controller", () => {
    const { game } = mkTable();
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 3);
    const bolt = castAt(game, "Lightning Bolt", miirym);
    game.advanceUntil((s) => s.zones.shared.stack.length === 2);

    const stack = game.state.zones.shared.stack;
    expect(stack[0]).toBe(bolt);
    const trigger = game.state.objects[stack[1]];
    expect(trigger.sourceObjectId).toBe(miirym);
    expect(trigger.controller).toBe(B);
    expect(trigger.targetedBy).toEqual(
      expect.objectContaining({ object: bolt, player: A }),
    );
  });

  it("asks the targeting player, offering Pay / decline with the spell named", () => {
    const { game } = mkTable();
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 3);
    const bolt = castAt(game, "Lightning Bolt", miirym);
    toWardChoice(game);

    expect(game.state.awaiting?.player).toBe(A);
    const offer = wardOffer(game, A);
    expect(offer?.source).toBe(miirym);
    expect(offer?.ward).toEqual({ spell: bolt });
    expect(offer?.modeTexts).toEqual(["Pay ward {2} (or Lightning Bolt is countered)"]);
    expect(wardOffer(game, B)).toBeUndefined();
  });

  it("declining counters the spell even when the cost is affordable", () => {
    const { game } = mkTable();
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    const lands = mountains(game, 3);
    castAt(game, "Lightning Bolt", miirym);
    toWardChoice(game);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[miirym].damageMarked).toBe(0);
    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.eventsOfType("spell-countered")).toHaveLength(1);
    // Only the Bolt's own {R} was spent.
    expect(lands.filter((id) => game.state.objects[id].tapped)).toHaveLength(1);
  });

  describe("Ward—Pay 2 life", () => {
    it("pays the life and the spell resolves", () => {
      const { game } = mkTable();
      const warded = game.debugSpawn("Life Ward Bear", B, "battlefield");
      mountains(game, 1);
      castAt(game, "Lightning Bolt", warded);
      toWardChoice(game);
      expect(wardOffer(game, A)?.modeTexts).toEqual([
        "Pay ward—Pay 2 life (or Lightning Bolt is countered)",
      ]);
      game.dispatch({ type: "choose-modes", player: A, modes: [0] });
      game.advanceUntil(settled);

      expect(game.state.players[A].life).toBe(18);
      expect(game.state.objects[warded].damageMarked).toBe(3);
      expect(game.eventsOfType("ward-paid")).toEqual([
        expect.objectContaining({ object: warded, player: A }),
      ]);
    });

    it("can pay down to exactly 0 life (rule 119.4), but not below", () => {
      for (const [life, paid] of [
        [2, true],
        [1, false],
      ] as const) {
        const { game } = mkTable();
        const warded = game.debugSpawn("Life Ward Bear", B, "battlefield");
        mountains(game, 1);
        game.state.players[A].life = life;
        castAt(game, "Lightning Bolt", warded);
        toWardChoice(game);
        expect(wardOffer(game, A) !== undefined).toBe(paid);
        if (paid) game.dispatch({ type: "choose-modes", player: A, modes: [0] });
        expect(game.state.players[A].life).toBe(paid ? 0 : life);
        expect(game.eventsOfType(paid ? "ward-paid" : "ward-unpaid")).toHaveLength(1);
      }
    });
  });

  describe("Ward—{2}, Pay 2 life: one compound cost", () => {
    it("pays both parts together", () => {
      const { game } = mkTable();
      const target = game.debugSpawn("Compound Ward Bear", B, "battlefield");
      const lands = mountains(game, 3);
      castAt(game, "Lightning Bolt", target);
      toWardChoice(game);
      expect(wardOffer(game, A)?.modeTexts).toEqual([
        "Pay ward—{2}, Pay 2 life (or Lightning Bolt is countered)",
      ]);
      game.dispatch({ type: "choose-modes", player: A, modes: [0] });
      game.advanceUntil(settled);

      expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
      expect(game.state.players[A].life).toBe(18);
      expect(game.state.objects[target].damageMarked).toBe(3);
    });

    it("isn't offered when only one part is affordable — the spell is countered", () => {
      // Life but no spare mana.
      const noMana = mkTable();
      const t1 = noMana.game.debugSpawn("Compound Ward Bear", B, "battlefield");
      mountains(noMana.game, 1);
      castAt(noMana.game, "Lightning Bolt", t1);
      toWardChoice(noMana.game);
      expect(noMana.game.state.awaiting).toBeNull();
      expect(noMana.game.state.objects[t1].damageMarked).toBe(0);
      expect(noMana.game.state.players[A].life).toBe(20);

      // Mana but not enough life.
      const noLife = mkTable();
      const t2 = noLife.game.debugSpawn("Compound Ward Bear", B, "battlefield");
      const lands = mountains(noLife.game, 3);
      noLife.game.state.players[A].life = 1;
      castAt(noLife.game, "Lightning Bolt", t2);
      toWardChoice(noLife.game);
      expect(noLife.game.state.awaiting).toBeNull();
      expect(noLife.game.state.objects[t2].damageMarked).toBe(0);
      expect(lands.filter((id) => noLife.game.state.objects[id].tapped)).toHaveLength(1);
      expect(noLife.game.eventsOfType("ward-unpaid")).toHaveLength(1);
    });
  });

  describe("Ward—Sacrifice an artifact", () => {
    it("the payer chooses which artifact to sacrifice", () => {
      const { game, a } = mkTable();
      const target = game.debugSpawn("Sacrifice Ward Bear", B, "battlefield");
      mountains(game, 1);
      const first = game.debugSpawn("Bonesplitter", A, "battlefield");
      const second = game.debugSpawn("Bonesplitter", A, "battlefield");
      let offered: readonly ObjectId[] = [];
      a.chooseSacrificesFn = (_view, eligible) => {
        offered = eligible;
        return [second];
      };
      castAt(game, "Lightning Bolt", target);
      toWardChoice(game);
      game.dispatch({ type: "choose-modes", player: A, modes: [0] });
      game.advanceUntil(settled);

      expect([...offered].sort()).toEqual([first, second].sort());
      expect(game.state.objects[second].zone).toBe("graveyard");
      expect(game.state.objects[first].zone).toBe("battlefield");
      expect(game.state.objects[target].damageMarked).toBe(3);
    });

    it("counters the spell when there's nothing to sacrifice", () => {
      const { game } = mkTable();
      const target = game.debugSpawn("Sacrifice Ward Bear", B, "battlefield");
      mountains(game, 1);
      castAt(game, "Lightning Bolt", target);
      toWardChoice(game);
      expect(game.state.awaiting).toBeNull();
      expect(game.state.objects[target].damageMarked).toBe(0);
    });
  });

  it("a compound cost can't spend one permanent on two parts", () => {
    // One Mountain pays for the Bolt; the Treasure could pay the {1} or be
    // the artifact sacrificed, but not both.
    const { game } = mkTable();
    const target = game.debugSpawn("Treasure Ward Bear", B, "battlefield");
    mountains(game, 1);
    game.debugSpawn("Treasure Token", A, "battlefield");
    castAt(game, "Lightning Bolt", target);
    toWardChoice(game);
    expect(game.state.awaiting).toBeNull();
    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.state.objects[target].damageMarked).toBe(0);

    // With a second artifact, both parts can be paid.
    const two = mkTable();
    const t2 = two.game.debugSpawn("Treasure Ward Bear", B, "battlefield");
    mountains(two.game, 1);
    two.game.debugSpawn("Treasure Token", A, "battlefield");
    two.game.debugSpawn("Bonesplitter", A, "battlefield");
    castAt(two.game, "Lightning Bolt", t2);
    toWardChoice(two.game);
    two.game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    two.game.advanceUntil(settled);
    expect(two.game.eventsOfType("ward-paid")).toHaveLength(1);
    expect(two.game.state.objects[t2].damageMarked).toBe(3);
  });

  describe("Ward—Discard a card", () => {
    it("the payer chooses which card to discard", () => {
      const { game, a } = mkTable({ hand: ["Lightning Bolt", "Llanowar Elves", "Forest"] });
      const target = game.debugSpawn("Discard Ward Bear", B, "battlefield");
      mountains(game, 1);
      castAt(game, "Lightning Bolt", target);
      toWardChoice(game);
      game.dispatch({ type: "choose-modes", player: A, modes: [0] });
      expect(game.state.awaiting?.kind).toBe("discard");
      const elves = named(game, game.handOf(A), "Llanowar Elves");
      game.dispatch({ type: "discard", player: A, cards: [elves] });
      game.advanceUntil(settled);
      void a;

      expect(game.state.objects[elves].zone).toBe("graveyard");
      expect(game.state.objects[target].damageMarked).toBe(3);
    });

    it("counters the spell when the payer's hand is empty", () => {
      const { game } = mkTable();
      const target = game.debugSpawn("Discard Ward Bear", B, "battlefield");
      mountains(game, 1);
      const hand = game.state.zones.perPlayer[A].hand;
      const bolt = named(game, hand, "Lightning Bolt");
      for (const id of hand.filter((id) => id !== bolt)) {
        game.state.objects[id].zone = "library";
        game.state.zones.perPlayer[A].library.push(id);
      }
      game.state.zones.perPlayer[A].hand = [bolt];
      castAt(game, "Lightning Bolt", target);
      toWardChoice(game);
      expect(game.state.awaiting).toBeNull();
      expect(game.state.objects[target].damageMarked).toBe(0);
    });
  });

  it("counters an opponent's triggered ability that targets the warded permanent", () => {
    const { game } = mkTable({ hand: [] });
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    const gargos = game.debugSpawn("Gargos, Vicious Watcher", B, "battlefield");
    game.debugSpawn("Ward Test Pinger", A, "battlefield", { announceEntry: true });
    game.advanceUntil(drained);

    // The pinger's trigger announced its target; ward countered it.
    expect(
      game.eventsOfType("object-targeted").some((e) => e.object === miirym && !e.bySpell),
    ).toBe(true);
    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.state.objects[miirym].damageMarked).toBe(0);
    // A countered ability ceases to exist — it isn't put anywhere.
    const countered = game.eventsOfType("spell-countered")[0].object;
    expect(game.state.objects[countered]).toBeUndefined();
    expect(game.graveyardOf(A).every((id) => game.state.objects[id].kind === "card")).toBe(true);
    // Gargos watches for *spells* only.
    expect(
      game.eventsOfType("ability-triggered").filter((e) => e.source === gargos),
    ).toHaveLength(0);
  });

  it("Thunderbreak Regent now sees a triggered ability target a Dragon", () => {
    const { game } = mkTable({ hand: [] });
    const regent = game.debugSpawn("Thunderbreak Regent", B, "battlefield");
    game.debugSpawn("Ward Test Pinger", A, "battlefield", { announceEntry: true });
    game.advanceUntil(drained);

    expect(game.state.objects[regent].damageMarked).toBe(1);
    expect(game.state.players[A].life).toBe(17);
  });

  it("an activated ability pays ward and resolves", () => {
    const { game, a } = mkTable({ hand: [] });
    a.chooseModesFn = () => [0];
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    const tim = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });
    mountains(game, 2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tim,
      abilityIndex: 0,
      targets: [{ kind: "object", object: miirym }],
    });
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid")).toHaveLength(1);
    expect(game.state.objects[miirym].damageMarked).toBe(1);
  });

  it("doesn't trigger for its own controller's spell", () => {
    const { game } = mkTable();
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", A, "battlefield");
    mountains(game, 1);
    castAt(game, "Lightning Bolt", miirym);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ability-triggered")).toHaveLength(0);
    expect(game.state.objects[miirym].damageMarked).toBe(3);
  });

  it("two instances trigger separately (rule 702.21b) — pay one, fail the other", () => {
    const { game, a } = mkTable();
    a.chooseModesFn = () => [0];
    const target = game.debugSpawn("Double Ward Bear", B, "battlefield");
    mountains(game, 2); // {R} for the Bolt + {1} for one ward
    castAt(game, "Lightning Bolt", target);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ability-triggered")).toHaveLength(2);
    expect(game.eventsOfType("ward-paid")).toHaveLength(1);
    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.state.objects[target].damageMarked).toBe(0);
  });

  it("two instances, both paid", () => {
    const { game, a } = mkTable();
    a.chooseModesFn = () => [0];
    const target = game.debugSpawn("Double Ward Bear", B, "battlefield");
    mountains(game, 3);
    castAt(game, "Lightning Bolt", target);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid")).toHaveLength(2);
    expect(game.state.objects[target].damageMarked).toBe(3);
  });

  it("a spell that can't be countered resolves anyway", () => {
    const { game } = mkTable({ hand: ["Uncounterable Shock"] });
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 1);
    castAt(game, "Uncounterable Shock", miirym);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.eventsOfType("counter-failed")).toHaveLength(1);
    expect(game.state.objects[miirym].damageMarked).toBe(2);
  });

  it("does nothing once the targeting spell has left the stack", () => {
    const { game } = mkTable();
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 1);
    const bolt = castAt(game, "Lightning Bolt", miirym);
    game.advanceUntil((s) => s.zones.shared.stack.length === 2);
    // Something else removed the Bolt in response.
    game.state.zones.shared.stack.splice(0, 1);
    game.state.objects[bolt].zone = "graveyard";
    game.state.objects[bolt].zoneChangeCount = 2;
    game.state.zones.perPlayer[A].graveyard.push(bolt);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-unpaid")).toHaveLength(0);
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
  });

  it("multiplayer: the player whose spell targeted it pays, not the active player", () => {
    const { game } = mkTable({ players: 3, hand: [] });
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", C, "battlefield");
    // Bob casts Bolt at Carol's Miirym during Alice's turn.
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    mountains(game, 3, B);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bolt,
      targets: [{ kind: "object", object: miirym }],
    });
    toWardChoice(game);

    expect(game.state.awaiting?.player).toBe(B);
    const trigger = game.eventsOfType("ability-triggered")[0];
    expect(trigger.controller).toBe(C);
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil(settled);
    expect(game.state.objects[miirym].damageMarked).toBe(3);
  });

  it("works when a static grants it (Goblins you control have ward {2})", () => {
    const { game } = mkTable({ hand: ["Lightning Bolt", "Lightning Bolt"] });
    game.debugSpawn("Goblin Warder", B, "battlefield");
    const goblin = game.debugSpawn("Ward Test Pinger", B, "battlefield");
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 1);
    castAt(game, "Lightning Bolt", goblin);
    game.advanceUntil(settled);
    expect(game.eventsOfType("ward-unpaid").map((e) => e.object)).toEqual([goblin]);
    expect(game.state.objects[goblin].zone).toBe("battlefield");
    void miirym;
  });

  it("the fuzzer's random answer is a legal one", () => {
    for (const roll of [0.1, 0.9]) {
      const { game } = mkTable();
      const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
      mountains(game, 3);
      castAt(game, "Lightning Bolt", miirym);
      toWardChoice(game);
      const offer = wardOffer(game, A);
      if (offer === undefined) throw new Error("no ward offer");
      const answer = randomAnswerFor(offer, A, {
        random: () => roll,
        pickIndex: () => 0,
        pickTargets: () => [],
      });
      if (answer === null) throw new Error("no random answer");
      game.dispatch(answer);
      game.advanceUntil(settled);
      const paid = game.eventsOfType("ward-paid").length === 1;
      expect(game.state.objects[miirym].damageMarked).toBe(paid ? 3 : 0);
    }
  });

  it("the v1 bot won't pay a life ward with all the life it has", () => {
    const { game } = mkTable({ bot: true });
    const warded = game.debugSpawn("Life Ward Bear", B, "battlefield");
    mountains(game, 1);
    game.state.players[A].life = 2;
    castAt(game, "Lightning Bolt", warded);
    game.advanceUntil(settled);
    expect(game.eventsOfType("ward-unpaid")).toHaveLength(1);
    expect(game.state.players[A].life).toBe(2);
    expect(game.state.result.over).toBe(false);
  });

  it("the v1 bot pays a ward it can afford", () => {
    const { game } = mkTable({ bot: true });
    const miirym = game.debugSpawn("Miirym, Sentinel Wyrm", B, "battlefield");
    mountains(game, 3);
    castAt(game, "Lightning Bolt", miirym);
    game.advanceUntil(settled);
    expect(game.eventsOfType("ward-paid")).toHaveLength(1);
    expect(game.state.objects[miirym].damageMarked).toBe(3);
  });
});
