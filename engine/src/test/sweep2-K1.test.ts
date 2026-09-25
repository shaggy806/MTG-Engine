/**
 * Card sweep 2, batch K1 (top-2000 Commander staples): the cards the engine
 * could already run, each driven through real play.
 */

import { describe, expect, it } from "vitest";

import { restrictionsOf } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      (player === undefined || game.state.objects[id].controller === player),
  );
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (
  game: Game,
  source: ObjectId,
  abilityIndex: number,
  targets: (TargetRef | null)[] = [],
  extra = {},
) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const pool = (game: Game, p: PlayerId) => poolCounts(game.state.players[p].manaPool);
/** Alice passes on an empty stack, so Bob holds priority in Alice's turn. */
const passToB = (game: Game) => {
  expect(game.state.priority.holder).toBe(A);
  game.dispatch({ type: "pass-priority", player: A });
  expect(game.state.priority.holder).toBe(B);
};
const castable = (game: Game, player: PlayerId, card: ObjectId): boolean =>
  game.legalActions(player).some((o) => o.kind === "cast-spell" && o.card === card);

describe("Professional Face-Breaker", () => {
  it("a Treasure when creatures connect; a Treasure sacrificed exiles the top card to play this turn", () => {
    const { game, a } = setUp();
    const breaker = spawn(game, "Professional Face-Breaker");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [
      { attacker: breaker, defender: B },
      { attacker: bears, defender: B },
    ];
    toStep(game, "postcombat-main");
    // One trigger for the one player dealt damage, however many creatures did.
    const treasures = named(game, "Treasure Token", A);
    expect(treasures).toHaveLength(1);

    const top = game.state.zones.perPlayer[A].library[0];
    activate(game, breaker, 0, [], { sacrifice: treasures[0] });
    expect(named(game, "Treasure Token", A)).toHaveLength(0);
    expect(game.state.objects[top].zone).toBe("exile");
    // The exiled card is an Island: playable this turn.
    expect(game.legalActions(A).some((o) => o.kind === "play-land" && o.card === top)).toBe(true);
  });
});

describe("The Great Henge", () => {
  it("costs {X} less for the greatest power (not the total), taps for {G}{G} and 2 life, and feeds nontoken creatures", () => {
    const { game } = setUp();
    spawn(game, "Hill Giant");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    const henge = game.debugSpawn("The Great Henge", A, "hand");
    lands(game, "Forest", 5);
    // {7}{G}{G} less 3 is six mana; five Forests aren't enough (a total-power
    // reading would make it two).
    expect(castable(game, A, henge)).toBe(false);
    spawn(game, "Forest");
    expect(castable(game, A, henge)).toBe(true);
    cast(game, henge);
    expect(game.state.objects[henge].zone).toBe("battlefield");

    const before = life(game, A);
    activate(game, henge, 0);
    expect(pool(game, A).G).toBe(2);
    expect(life(game, A)).toBe(before + 2);

    const hand = game.handOf(A).length;
    const elf = game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[elf].counters["+1/+1"]).toBe(1);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Grand Abolisher", () => {
  it("opponents can't cast spells or activate artifacts' abilities during your turn", () => {
    const setUpBob = (withAbolisher: boolean) => {
      const { game } = setUp();
      lands(game, "Island", 2, B);
      const rock = spawn(game, "Mind Stone", B);
      const spell = game.debugSpawn("Opt", B, "hand");
      if (withAbolisher) spawn(game, "Grand Abolisher");
      passToB(game);
      return {
        game,
        castsOpt: castable(game, B, spell),
        usesRock: game.legalActions(B).some((o) => o.kind === "activate-ability" && o.source === rock),
        spell,
      };
    };
    const free = setUpBob(false);
    expect(free.castsOpt).toBe(true);
    expect(free.usesRock).toBe(true);
    const barred = setUpBob(true);
    expect(barred.castsOpt).toBe(false);
    expect(barred.usesRock).toBe(false);
    // On Bob's own turn the prohibition is off.
    barred.game.advanceUntil(
      (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s) && s.priority.holder === B,
    );
    expect(castable(barred.game, B, barred.spell)).toBe(true);
  });
});

describe("Shadowmoor filter lands", () => {
  it("Rugged Prairie turns {R/W} into two mana of R/W, chosen by hand", () => {
    const { game } = setUp();
    const prairie = spawn(game, "Rugged Prairie");
    spawn(game, "Mountain");
    activate(game, prairie, 1, [], { manaColors: ["R", "W"] });
    expect(game.state.objects[prairie].tapped).toBe(true);
    expect(pool(game, A)).toMatchObject({ R: 1, W: 1 });
  });

  it("every filter land's colourless ability and pair", () => {
    const pairs: Record<string, [string, string]> = {
      "Rugged Prairie": ["R", "W"],
      "Cascade Bluffs": ["U", "R"],
      "Flooded Grove": ["G", "U"],
      "Fetid Heath": ["W", "B"],
      "Twilight Mire": ["B", "G"],
    };
    for (const [name, [x, y]] of Object.entries(pairs)) {
      const { game } = setUp();
      const land = spawn(game, name);
      spawn(game, "Plains");
      spawn(game, "Island");
      spawn(game, "Swamp");
      spawn(game, "Mountain");
      spawn(game, "Forest");
      activate(game, land, 1, [], { manaColors: [y, y] });
      expect(pool(game, A)[y as "W"], name).toBeGreaterThanOrEqual(2);
      expect(registry.get(name).activated[1].cost.mana).toBe(`{${x}/${y}}`);
    }
  });
});

describe("Phyrexian Altar", () => {
  it("sacrifices a creature for one mana of any colour", () => {
    const { game } = setUp();
    const altar = spawn(game, "Phyrexian Altar");
    const bears = spawn(game, "Grizzly Bears");
    activate(game, altar, 0, [], { sacrifice: bears, manaColors: ["B"] });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(pool(game, A).B).toBe(1);
  });
});

describe("Bala Ged Recovery // Bala Ged Sanctuary", () => {
  it("returns a card from your graveyard, or is played as a land that enters tapped", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    const dead = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const recovery = game.debugSpawn("Bala Ged Recovery", A, "hand");
    cast(game, recovery, [obj(dead)]);
    expect(game.state.objects[dead].zone).toBe("hand");

    const land = game.debugSpawn("Bala Ged Recovery", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: land, face: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
  });
});

describe("Malakir Rebirth", () => {
  it("costs 2 life, and the creature comes back tapped when it dies this turn", () => {
    const { game } = setUp();
    lands(game, "Swamp", 1);
    const bears = spawn(game, "Grizzly Bears");
    const rebirth = game.debugSpawn("Malakir Rebirth", A, "hand");
    cast(game, rebirth, [obj(bears)]);
    expect(life(game, A)).toBe(18);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    const back = named(game, "Grizzly Bears", A);
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].tapped).toBe(true);
    // A second death is a new object: the grant didn't come back with it.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(back[0])]);
    game.advanceUntil(quiet);
    expect(named(game, "Grizzly Bears", A)).toHaveLength(0);
  });
});

describe("Fabled Passage", () => {
  const fetchWith = (otherLands: number) => {
    const { game, a } = setUp();
    const basic = game.debugSpawn("Forest", A, "library");
    lands(game, "Island", otherLands);
    const passage = spawn(game, "Fabled Passage");
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === basic);
    activate(game, passage, 0);
    expect(game.state.objects[basic].zone).toBe("battlefield");
    return game.state.objects[basic].tapped;
  };

  it("the land enters tapped with fewer than four lands", () => {
    expect(fetchWith(2)).toBe(true);
  });

  it("and is untapped once you control four or more", () => {
    expect(fetchWith(3)).toBe(false);
  });
});

describe("Demolition Field", () => {
  it("destroys a nonbasic land; its controller and you may each fetch a basic", () => {
    const { game, a, b } = setUp();
    const field = spawn(game, "Demolition Field");
    lands(game, "Island", 2);
    const target = spawn(game, "Fabled Passage", B);
    const mine = game.debugSpawn("Forest", A, "library");
    const theirs = game.debugSpawn("Plains", B, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === mine);
    b.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === theirs);
    activate(game, field, 1, [obj(target)]);
    expect(game.state.objects[target].zone).toBe("graveyard");
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(B);
    expect(game.state.objects[theirs].tapped).toBe(false);
    expect(game.state.objects[mine].zone).toBe("battlefield");
    expect(game.state.objects[mine].controller).toBe(A);
  });

  it("can't target a basic land", () => {
    const { game } = setUp();
    const field = spawn(game, "Demolition Field");
    lands(game, "Island", 2);
    spawn(game, "Forest", B);
    expect(
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === field && o.abilityIndex === 1),
    ).toBe(false);
  });
});

describe("Silence", () => {
  it("opponents can't cast spells for the rest of the turn", () => {
    const { game } = setUp();
    lands(game, "Plains", 1);
    lands(game, "Island", 1, B);
    const opt = game.debugSpawn("Opt", B, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Silence", A, "hand"), targets: [] });
    passToB(game);
    // With Silence still on the stack, Bob may respond.
    expect(castable(game, B, opt)).toBe(true);
    game.dispatch({ type: "pass-priority", player: B });
    game.advanceUntil(quiet);
    passToB(game);
    expect(castable(game, B, opt)).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === B);
    expect(castable(game, B, opt)).toBe(true);
  });
});

describe("Bident of Thassa", () => {
  it("may draw per creature that connects, and makes opponents' creatures attack this turn", () => {
    const { game, a } = setUp();
    const bident = spawn(game, "Bident of Thassa");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    a.chooseModesFn = () => [0];
    const hand = game.handOf(A).length;
    toStep(game, "postcombat-main");
    expect(game.handOf(A).length).toBe(hand + 2);

    const theirs = spawn(game, "Grizzly Bears", B);
    lands(game, "Island", 2);
    activate(game, bident, 0);
    expect(restrictionsOf(game.state, registry, theirs).has("must-attack")).toBe(true);
    // A creature arriving later this turn is bound as well; Alice's aren't.
    const late = spawn(game, "Hill Giant", B);
    expect(restrictionsOf(game.state, registry, late).has("must-attack")).toBe(true);
    expect(restrictionsOf(game.state, registry, bears).has("must-attack")).toBe(false);
  });
});

describe("Geier Reach Sanitarium", () => {
  it("each player draws a card, then discards a card", () => {
    const { game } = setUp();
    const sanitarium = spawn(game, "Geier Reach Sanitarium");
    lands(game, "Island", 2);
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    const graveB = game.state.zones.perPlayer[B].graveyard.length;
    activate(game, sanitarium, 1);
    expect(game.handOf(A).length).toBe(handA);
    expect(game.handOf(B).length).toBe(handB);
    expect(game.state.zones.perPlayer[B].graveyard.length).toBe(graveB + 1);
  });
});

describe("Ohran Frostfang", () => {
  it("attacking creatures have deathtouch, and each that connects draws a card", () => {
    const { game, a } = setUp();
    spawn(game, "Ohran Frostfang");
    const bears = spawn(game, "Grizzly Bears");
    const home = spawn(game, "Hill Giant");
    expect(game.characteristics(bears).keywords).not.toContain("deathtouch");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(bears).keywords).toContain("deathtouch");
    expect(game.characteristics(home).keywords).not.toContain("deathtouch");
    toStep(game, "postcombat-main");
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Entish Restoration", () => {
  const restore = (withBigCreature: boolean) => {
    const { game, a } = setUp();
    const forests = lands(game, "Forest", 3);
    if (withBigCreature) {
      // A 3/3 made 4/4: power 4 exactly is enough.
      const giant = spawn(game, "Hill Giant");
      game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(giant)]);
    }
    const basics = [0, 1, 2].map(() => game.debugSpawn("Plains", A, "library"));
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.filter((id) => basics.includes(id)).slice(0, max);
    cast(game, game.debugSpawn("Entish Restoration", A, "hand"));
    const found = basics.filter((id) => game.state.objects[id].zone === "battlefield");
    expect(found.every((id) => game.state.objects[id].tapped)).toBe(true);
    // One of the three Forests (all tapped to pay) was sacrificed.
    expect(forests.filter((id) => game.state.objects[id].zone === "graveyard")).toHaveLength(1);
    return found.length;
  };

  it("sacrifices a land and fetches up to two basics tapped", () => {
    expect(restore(false)).toBe(2);
  });

  it("up to three with a creature of power 4 or greater", () => {
    expect(restore(true)).toBe(3);
  });
});
