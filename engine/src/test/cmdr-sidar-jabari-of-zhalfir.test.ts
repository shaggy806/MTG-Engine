/**
 * Sidar Jabari of Zhalfir — {1}{W}{U}{B} legendary 4/3 Human Knight.
 *
 *   Eminence — Whenever you attack with one or more Knights, if Sidar Jabari
 *   is in the command zone or on the battlefield, draw a card, then discard a
 *   card.
 *   Flying, first strike
 *   Whenever Sidar Jabari deals combat damage to a player, return target
 *   Knight creature card from your graveyard to the battlefield.
 *
 * Nothing new in the engine: Edgar Markov's Eminence shape (`fromCommandZone`
 * plus a `source-zone` intervening-if) on an `attack-with` trigger, and
 * Squall's combat-damage recursion over a `card-in-graveyard` slot.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameObject, GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const SIDAR = "Sidar Jabari of Zhalfir";

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

/** Alice's commander is Sidar Jabari when `commander` is set; he starts in the
 * command zone. */
const makeGame = (opts: { commander?: boolean } = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: pad([]),
        ...(opts.commander === true ? { commander: SIDAR } : {}),
      },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const onBoard = (game: Game, name: string, who: PlayerId): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });
const inGraveyard = (game: Game, name: string, who: PlayerId): ObjectId =>
  game.debugSpawn(name, who, "graveyard");

const sidarInCommand = (game: Game): ObjectId => {
  const id = game.state.zones.shared.command.find(
    (i) => game.state.objects[i].cardName === SIDAR,
  );
  if (id === undefined) throw new Error("Sidar Jabari isn't in the command zone");
  return id;
};

// White-box, like `debugSpawn`: the real zone change with nothing behind it,
// standing in for casting Sidar Jabari, or his dying and going home.
const move = (game: Game, id: ObjectId, to: "hand" | "battlefield" | "command"): void => {
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, to);
};

const zones = (game: Game) => {
  const z = game.state.zones.perPlayer[A];
  return { hand: z.hand.length, library: z.library.length, graveyard: z.graveyard.length };
};

/**
 * Make Alice discard the card on top of her library when the loot resolves —
 * which she can only do if the draw happened first. Returns that card.
 */
const discardTheDrawnCard = (game: Game, a: ScriptedController): ObjectId => {
  const top = game.state.zones.perPlayer[A].library[0];
  a.chooseDiscards = (hand: readonly GameObject[]) => {
    expect(hand.map((o) => o.id)).toContain(top);
    return [top];
  };
  return top;
};

const loots = (game: Game): number =>
  game.eventsOfType("cards-discarded").filter((e) => e.player === A).length;

describe("Sidar Jabari of Zhalfir — Eminence", () => {
  it("loots from the command zone when you attack with a Knight", () => {
    const { game, a } = makeGame({ commander: true });
    const knight = onBoard(game, "White Knight", A);
    const drawn = discardTheDrawnCard(game, a);
    const before = zones(game);
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    // Drew the top card, then discarded it: the hand is back where it was.
    expect(game.state.objects[drawn].zone).toBe("graveyard");
    expect(zones(game)).toEqual({
      hand: before.hand,
      library: before.library - 1,
      graveyard: before.graveyard + 1,
    });
    expect(loots(game)).toBe(1);
    // Sidar Jabari never left the command zone to do it.
    expect(game.state.objects[sidarInCommand(game)].zone).toBe("command");
  });

  it("loots once for a whole attack, however many Knights", () => {
    const { game, a } = makeGame({ commander: true });
    const knights = [onBoard(game, "White Knight", A), onBoard(game, "White Knight", A)];
    const before = zones(game);
    a.declareAttackersFn = () => knights.map((attacker) => ({ attacker, defender: B }));

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(loots(game)).toBe(1);
    expect(zones(game).library).toBe(before.library - 1);
  });

  it("counts a Knight among other attackers", () => {
    const { game, a } = makeGame({ commander: true });
    const bears = onBoard(game, "Grizzly Bears", A);
    const knight = onBoard(game, "White Knight", A);
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: knight, defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(loots(game)).toBe(1);
  });

  // NEGATIVE: no Knight among the attackers.
  it("doesn't trigger when no Knight attacks", () => {
    const { game, a } = makeGame({ commander: true });
    const bears = onBoard(game, "Grizzly Bears", A);
    const before = zones(game);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(loots(game)).toBe(0);
    expect(zones(game)).toEqual(before);
  });

  // NEGATIVE: "whenever **you** attack" — an opponent's Knights don't count.
  it("doesn't trigger when an opponent attacks with a Knight", () => {
    const { game, b } = makeGame({ commander: true });
    const knight = onBoard(game, "White Knight", B);
    b.declareAttackersFn = () => [{ attacker: knight, defender: A }];

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    game.advanceUntil(settled);

    expect(loots(game)).toBe(0);
    expect(game.eventsOfType("cards-discarded")).toHaveLength(0);
  });

  it("loots when Sidar Jabari attacks on his own — he's a Knight", () => {
    const { game, a } = makeGame();
    const sidar = onBoard(game, SIDAR, A);
    const drawn = discardTheDrawnCard(game, a);
    a.declareAttackersFn = () => [{ attacker: sidar, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[drawn].zone).toBe("graveyard");
    expect(loots(game)).toBe(1);
  });

  // NEGATIVE: Eminence is the only ability that works from the command zone.
  // His flying and first strike don't (there's nothing on the battlefield to
  // have them), and neither does the combat-damage recursion.
  it("doesn't recur a Knight from the command zone", () => {
    const { game, a } = makeGame({ commander: true });
    const knight = onBoard(game, "White Knight", A);
    const buried = inGraveyard(game, "White Knight", A);
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[buried].zone).toBe("graveyard");
  });

  describe("'if Sidar Jabari is in the command zone or on the battlefield' (rule 603.4)", () => {
    /** Alice attacks with a Knight; returns with the loot on the stack. */
    const lootOnTheStack = (setup: (game: Game) => void = () => {}) => {
      const { game, a } = makeGame({ commander: true });
      setup(game);
      const knight = onBoard(game, "White Knight", A);
      a.declareAttackersFn = () => [{ attacker: knight, defender: B }];
      game.advanceUntil(
        (s) => s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 1,
      );
      return { game, a, before: zones(game) };
    };
    const fizzledOnIntervening = (game: Game): boolean =>
      game.events.some((e) => e.type === "spell-fizzled" && /intervening-if/.test(e.reason));

    it("resolves normally while Sidar Jabari stays put", () => {
      const { game, before } = lootOnTheStack();
      game.advanceUntil(settled);
      expect(loots(game)).toBe(1);
      expect(zones(game).library).toBe(before.library - 1);
      expect(fizzledOnIntervening(game)).toBe(false);
    });

    it("does nothing once Sidar Jabari has left for a hand", () => {
      const { game, before } = lootOnTheStack();
      move(game, sidarInCommand(game), "hand");
      game.advanceUntil(settled);

      expect(loots(game)).toBe(0);
      expect(zones(game).library).toBe(before.library);
      expect(fizzledOnIntervening(game)).toBe(true);
    });

    // The card's ruling: on the battlefield when the ability triggers, then
    // put into the command zone before it resolves, it's a new object — the
    // loot does nothing even though he's back in one of the two zones.
    it("does nothing if Sidar Jabari moved from the battlefield to the command zone", () => {
      let sidar: ObjectId | undefined;
      const { game, before } = lootOnTheStack((g) => {
        sidar = sidarInCommand(g);
        move(g, sidar, "battlefield");
      });
      if (sidar === undefined) throw new Error("no Sidar Jabari");
      expect(game.state.objects[sidar].zone).toBe("battlefield");

      move(game, sidar, "command");
      expect(game.state.objects[sidar].zone).toBe("command");
      game.advanceUntil(settled);

      expect(loots(game)).toBe(0);
      expect(zones(game).library).toBe(before.library);
      expect(fizzledOnIntervening(game)).toBe(true);
    });
  });
});

describe("Sidar Jabari of Zhalfir — flying, first strike", () => {
  it("has flying and first strike on the battlefield", () => {
    const { game } = makeGame();
    const sidar = onBoard(game, SIDAR, A);
    const keywords = game.characteristics(sidar).keywords;
    expect(keywords.has("flying")).toBe(true);
    expect(keywords.has("first-strike")).toBe(true);
  });

  it("kills a 4-toughness blocker in the first-strike step and takes nothing back", () => {
    const { game, a, b } = makeGame();
    const sidar = onBoard(game, SIDAR, A);
    // Serra Angel: 4/4 flying — a legal blocker for a flier, and one that
    // would kill Sidar Jabari (4 damage to his 3 toughness) if it struck back.
    const angel = onBoard(game, "Serra Angel", B);
    a.declareAttackersFn = () => [{ attacker: sidar, defender: B }];
    b.declareBlockersFn = () => [{ blocker: angel, attacker: sidar }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[angel].zone).toBe("graveyard");
    expect(game.state.objects[sidar].zone).toBe("battlefield");
    expect(game.state.objects[sidar].damageMarked).toBe(0);
  });

  // NEGATIVE: flying — a ground creature without reach can't block him.
  it("can't be blocked by a creature without flying or reach", () => {
    const { game, a, b } = makeGame();
    const sidar = onBoard(game, SIDAR, A);
    const bears = onBoard(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: sidar, defender: B }];
    // Bob would block if asked; with no creature able to, he isn't.
    b.declareBlockersFn = () => [{ blocker: bears, attacker: sidar }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);
    // A block would have soaked all four; they reached Bob.
    expect(game.state.players[B].life).toBe(16);
  });
});

describe("Sidar Jabari of Zhalfir — combat-damage recursion", () => {
  /** Sidar Jabari on the battlefield (not the commander, so Eminence stays
   * out of the way unless he attacks) and a graveyard for Alice. */
  const attackWithSidar = (graveyard: readonly string[]) => {
    const { game, a, b } = makeGame();
    const sidar = onBoard(game, SIDAR, A);
    const yard = graveyard.map((name) => inGraveyard(game, name, A));
    a.declareAttackersFn = () => [{ attacker: sidar, defender: B }];
    return { game, a, b, sidar, yard };
  };

  it("returns a Knight creature card to the battlefield under your control", () => {
    const { game, yard } = attackWithSidar(["Grizzly Bears", "White Knight", "Lightning Bolt"]);
    const [bears, knight, bolt] = yard;

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(16);
    expect(game.state.objects[knight].zone).toBe("battlefield");
    expect(game.state.objects[knight].controller).toBe(A);
    // NEGATIVE: a creature that isn't a Knight, and a card that isn't a
    // creature, both stay.
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("lets you choose which Knight", () => {
    const { game, a, yard } = attackWithSidar(["White Knight", "Wilt-Leaf Cavaliers"]);
    const [whiteKnight, cavaliers] = yard;
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, source, _specs, legalOptions) => {
      expect(source).toBe(SIDAR);
      offered = legalOptions[0].flatMap((ref) => (ref.kind === "object" ? [ref.object] : []));
      return [{ kind: "object", object: cavaliers }];
    };

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect([...offered].sort()).toEqual([whiteKnight, cavaliers].sort());
    expect(game.state.objects[cavaliers].zone).toBe("battlefield");
    expect(game.state.objects[whiteKnight].zone).toBe("graveyard");
  });

  // NEGATIVE: "from **your** graveyard".
  it("can't reach an opponent's graveyard", () => {
    const { game } = attackWithSidar([]);
    const theirs = inGraveyard(game, "White Knight", B);

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(16);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });

  // NEGATIVE: blocked, so no combat damage to a player and no trigger.
  it("returns nothing when Sidar Jabari is blocked", () => {
    const { game, b, sidar, yard } = attackWithSidar(["White Knight"]);
    const spider = onBoard(game, "Giant Spider", B); // 2/4 reach
    b.declareBlockersFn = () => [{ blocker: spider, attacker: sidar }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[yard[0]].zone).toBe("graveyard");
  });
});
