/**
 * The cards behind the mana-spending, play-from-exile and cast-from-the-top
 * features: one focused test per card whose behaviour is more than a stat
 * line, written from its Oracle text.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (opts: { aCards?: readonly string[]; bCards?: readonly string[] } = {}) => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40, maxLandsPerTurn: 1 },
    controllers,
    decks: [
      { player: A, cards: [...(opts.aCards ?? []), ...Array(40).fill("Island")] },
      { player: B, cards: [...(opts.bCards ?? []), ...Array(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);

const offers = (game: Game, card: ObjectId, player: PlayerId = A) =>
  game.legalActions(player).filter((a) => (a.kind === "cast-spell" || a.kind === "play-land") && a.card === card);

const lands = (game: Game, name: string, n: number, player: PlayerId = A) => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

const ready = (game: Game, name: string, player: PlayerId = A) =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

/** Attack Bob with `attackers` and play on until combat is over. */
const hitBob = (game: Game, c: Record<PlayerId, ScriptedController>, attackers: readonly ObjectId[]) => {
  c[A].declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.turn.step === "end-of-combat" || s.turn.step === "postcombat-main");
  quiet(game);
  c[A].declareAttackersFn = () => [];
};

/** Activate `source`'s ability whose text includes `text`. */
const activate = (game: Game, source: ObjectId, text: string) => {
  const ability = game
    .legalActions(A)
    .find((a) => a.kind === "activate-ability" && a.source === source && a.text.includes(text));
  if (ability?.kind !== "activate-ability") throw new Error("no ability to activate");
  game.dispatch({
    type: "activate-ability",
    player: A,
    source,
    abilityIndex: ability.abilityIndex,
    targets: [],
  });
};

describe("Gonti, Canny Acquisitor", () => {
  it("one trigger for two creatures' combat damage: Bob's top card, face down, cast for {1} less with any type", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Gonti, Canny Acquisitor", A, "battlefield");
    const under = game.debugSpawn("Grizzly Bears", B, "library");
    const top = game.debugSpawn("Craw Wurm", B, "library");
    hitBob(game, c, [ready(game, "Grizzly Bears"), ready(game, "Grizzly Bears")]);

    expect(game.state.objects[top].zone).toBe("exile");
    expect(game.state.objects[under].zone).toBe("library");
    expect(game.state.objects[top].exiledFaceDown?.lookers).toEqual([A]);
    expect(game.viewFor(B).objects[top]).toBeUndefined();

    // Craw Wurm is {4}{G}{G}: five Islands pay it, {1} off and any type.
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A);
    lands(game, "Island", 5);
    expect(offers(game, top)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: top, targets: [], via: "impulse" });
    quiet(game);
    expect(game.state.objects[top].zone).toBe("battlefield");
    expect(game.state.objects[top].controller).toBe(A);
  });

  it("the discount is for spells you cast but don't own — not your own", () => {
    const { game } = mkGame();
    game.debugSpawn("Gonti, Canny Acquisitor", A, "battlefield");
    lands(game, "Forest", 1);
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "hand"))).toHaveLength(0);
  });
});

describe("Laughing Jasper Flint", () => {
  it("upkeep: exiles X of target opponent's cards, X the outlaws you control; cast this turn with any type", () => {
    const { game } = mkGame();
    game.debugSpawn("Laughing Jasper Flint", A, "battlefield");
    ready(game, "Grizzly Bears");
    lands(game, "Island", 2);
    // Past Bob's draw, so his top cards are still there at Alice's upkeep.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end");
    const second = game.debugSpawn("Forest", B, "library");
    const top = game.debugSpawn("Grizzly Bears", B, "library");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);

    // Jasper is a Rogue — an outlaw — and the Bears aren't: X is 1.
    expect(game.state.objects[top].zone).toBe("exile");
    expect(game.state.objects[second].zone).toBe("library");
    expect(offers(game, top)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: top, targets: [], via: "impulse" });
    quiet(game);
    expect(game.state.objects[top].zone).toBe("battlefield");
  });

  it("creatures you control but don't own are Mercenaries — outlaws too", () => {
    const { game } = mkGame();
    game.debugSpawn("Laughing Jasper Flint", A, "battlefield");
    const stolen = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const own = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(stolen).subtypes).not.toContain("Mercenary");
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [
      { kind: "object", object: stolen },
    ]);
    expect(game.characteristics(stolen).subtypes).toContain("Mercenary");
    expect(game.characteristics(own).subtypes).not.toContain("Mercenary");
  });
});

describe("Grolnok, the Omnivore", () => {
  it("a Frog attacking mills three; the permanent cards milled are exiled with croak counters, the rest stay", () => {
    const { game, c } = mkGame();
    const grolnok = ready(game, "Grolnok, the Omnivore");
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const forest = game.debugSpawn("Forest", A, "library");
    hitBob(game, c, [grolnok]);
    expect(game.state.objects[forest].zone).toBe("exile");
    expect(game.state.objects[forest].counters["croak"]).toBe(1);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("a creature that isn't a Frog attacking mills nothing", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Grolnok, the Omnivore", A, "battlefield");
    const before = game.state.zones.perPlayer[A].library.length;
    hitBob(game, c, [ready(game, "Grizzly Bears")]);
    expect(game.state.zones.perPlayer[A].library.length).toBe(before);
  });
});

describe("Haldan, Avid Arcanist with Pako, Arcane Retriever", () => {
  it("Pako's fetch-counter cards: Haldan casts Bob's sorcery off Mountains", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Haldan, Avid Arcanist", A, "battlefield");
    const divination = game.debugSpawn("Divination", B, "library");
    hitBob(game, c, [ready(game, "Pako, Arcane Retriever")]);
    expect(game.state.objects[divination].counters["fetch"]).toBe(1);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A);
    lands(game, "Mountain", 3);
    expect(offers(game, divination)).toHaveLength(1);
  });
});

describe("Tinybones, Bauble Burglar", () => {
  it("its ability makes Bob discard; the card is exiled with a stash counter and castable on Alice's turn with any type", () => {
    const { game, c } = mkGame({ bCards: ["Grizzly Bears"] });
    const tiny = game.debugSpawn("Tinybones, Bauble Burglar", A, "battlefield", { summoningSick: false });
    lands(game, "Swamp", 4);
    c[B].chooseDiscardsFn = (hand) => {
      const bears = hand.find((o) => o.cardName === "Grizzly Bears");
      return bears === undefined ? [hand[0].id] : [bears.id];
    };
    activate(game, tiny, "discards");
    quiet(game);
    const exiled = game.state.zones.shared.exile.find((id) => game.state.objects[id].cardName === "Grizzly Bears");
    expect(exiled).toBeDefined();
    expect(game.state.objects[exiled!].counters["stash"]).toBe(1);
    lands(game, "Swamp", 2);
    expect(offers(game, exiled!)).toHaveLength(1);
  });
});

describe("Sigarda, Font of Blessings", () => {
  it("other permanents you control have hexproof — not Sigarda, not Bob's", () => {
    const { game } = mkGame();
    const sigarda = game.debugSpawn("Sigarda, Font of Blessings", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(game.characteristics(bears).keywords.has("hexproof")).toBe(true);
    expect(game.characteristics(land).keywords.has("hexproof")).toBe(true);
    expect(game.characteristics(sigarda).keywords.has("hexproof")).toBe(false);
    expect(game.characteristics(theirs).keywords.has("hexproof")).toBe(false);
  });
});

describe("the look-and-cast-from-the-top family", () => {
  it("Korlessa casts a Dragon from the top, not a Bear", () => {
    const { game } = mkGame();
    game.debugSpawn("Korlessa, Scale Singer", A, "battlefield");
    // Mana for either, so only the permission decides.
    lands(game, "Mountain", 2);
    lands(game, "Forest", 3);
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Thundermane Dragon", A, "library"))).toHaveLength(1);
  });

  it("Mystic Forge: artifact and colourless spells, not a coloured one or a land; its ability exiles the top", () => {
    const { game } = mkGame();
    const forge = game.debugSpawn("Mystic Forge", A, "battlefield");
    lands(game, "Wastes", 3);
    lands(game, "Forest", 2);
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Wastes", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Glaring Fleshraker", A, "library"))).toHaveLength(1);
    const sol = game.debugSpawn("Sol Ring", A, "library");
    expect(offers(game, sol)).toHaveLength(1);
    const life = game.state.players[A].life;
    activate(game, forge, "Exile");
    quiet(game);
    expect(game.state.objects[sol].zone).toBe("exile");
    expect(game.state.players[A].life).toBe(life - 1);
    expect(offers(game, sol)).toHaveLength(0);
  });

  it("Crystal Skull: a historic spell and a historic land, not a plain one", () => {
    const { game } = mkGame();
    game.debugSpawn("Crystal Skull, Isu Spyglass", A, "battlefield");
    lands(game, "Island", 2);
    lands(game, "Forest", 2);
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Forest", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Sol Ring", A, "library"))).toHaveLength(1);
    expect(offers(game, game.debugSpawn("Haldan, Avid Arcanist", A, "library"))).toHaveLength(1);
  });

  it("Elven Chorus: creature spells from the top, and creatures tap for any colour", () => {
    const { game } = mkGame();
    game.debugSpawn("Elven Chorus", A, "battlefield");
    ready(game, "Grizzly Bears");
    ready(game, "Grizzly Bears");
    ready(game, "Grizzly Bears");
    expect(offers(game, game.debugSpawn("Divination", A, "library"))).toHaveLength(0);
    // Creatures tapping for any colour pay {1}{G} (and would pay {2}{U}).
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "library"))).toHaveLength(1);
  });

  it("Hakoda: Ally spells from the top; sacrificed, creatures you control get +0/+5 and indestructible", () => {
    const { game } = mkGame();
    const hakoda = game.debugSpawn("Hakoda, Selfless Commander", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    activate(game, hakoda, "Sacrifice");
    quiet(game);
    expect(game.state.objects[hakoda].zone).toBe("graveyard");
    expect(game.characteristics(bears).toughness).toBe(7);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
  });

  it("Emperor Mihail II: a Merfolk spell from the top, and {1} paid for a Merfolk token", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Emperor Mihail II", A, "battlefield");
    lands(game, "Island", 3);
    c[A].chooseModesFn = () => [0];
    const merfolk = game.debugSpawn("Coral Merfolk", A, "library");
    expect(offers(game, merfolk)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: merfolk, targets: [], via: "library-top" });
    quiet(game);
    const tokens = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Merfolk Token",
    );
    expect(tokens).toHaveLength(1);
  });

  it("Realmwalker: creature spells of the chosen type from the top", () => {
    const { game, c } = mkGame();
    c[A].chooseCreatureTypeFn = (_view, _source, options) => options.find((o) => o === "Bear") ?? options[0];
    lands(game, "Forest", 5);
    const walker = game.debugSpawn("Realmwalker", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: walker, targets: [] });
    quiet(game);
    expect(game.state.objects[walker].chosenCreatureType).toBe("Bear");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    expect(offers(game, game.debugSpawn("Llanowar Elves", A, "library"))).toHaveLength(0);
    expect(offers(game, game.debugSpawn("Grizzly Bears", A, "library"))).toHaveLength(1);
  });
});

describe("Stolen Strategy and Outrageous Robbery", () => {
  it("Stolen Strategy: each opponent's top card, castable this turn only, any colour, never a land", () => {
    const { game } = mkGame();
    game.debugSpawn("Stolen Strategy", A, "battlefield");
    lands(game, "Island", 2);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end");
    const bears = game.debugSpawn("Grizzly Bears", B, "library");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(offers(game, bears)).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(offers(game, bears)).toHaveLength(0);
  });

  it("Outrageous Robbery: X cards face down, played with any type, for as long as they stay exiled", () => {
    const { game } = mkGame();
    lands(game, "Swamp", 4);
    const robbery = game.debugSpawn("Outrageous Robbery", A, "hand");
    const forest = game.debugSpawn("Forest", B, "library");
    const bears = game.debugSpawn("Grizzly Bears", B, "library");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: robbery,
      targets: [{ kind: "player", player: B }],
      xValue: 2,
    });
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[forest].zone).toBe("exile");
    expect(game.viewFor(B).objects[bears]).toBeUndefined();
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(offers(game, forest).map((a) => a.kind)).toEqual(["play-land"]);
    expect(offers(game, bears)).toHaveLength(1);
  });
});

describe("Chromatic Orrery", () => {
  it("draws a card for each colour among permanents you control", () => {
    const { game } = mkGame();
    const orrery = game.debugSpawn("Chromatic Orrery", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Haldan, Avid Arcanist", A, "battlefield");
    game.debugSpawn("Haldan, Avid Arcanist", B, "battlefield");
    lands(game, "Wastes", 5);
    const hand = game.handOf(A).length;
    activate(game, orrery, "Draw");
    quiet(game);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("Grenzo, Havoc Raiser", () => {
  it("the exile mode: that player's top card, castable this turn with any colour", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Grenzo, Havoc Raiser", A, "battlefield");
    // A creature of Bob's, so both modes are on offer.
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "library");
    c[A].chooseModesFn = () => [1];
    hitBob(game, c, [ready(game, "Grizzly Bears")]);
    expect(game.state.objects[bears].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A);
    lands(game, "Mountain", 2);
    expect(offers(game, bears)).toHaveLength(1);
  });

  it("the goad mode: a creature that player controls", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Grenzo, Havoc Raiser", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    c[A].chooseModesFn = () => [0];
    hitBob(game, c, [ready(game, "Grizzly Bears")]);
    expect(game.state.objects[theirs].goadedBy).toContain(A);
  });
});

describe("You Find Some Prisoners", () => {
  it("Interrogate Them: three exiled, one chosen, playable through your next turn with any colour", () => {
    const { game, c } = mkGame();
    lands(game, "Mountain", 2);
    const spell = game.debugSpawn("You Find Some Prisoners", A, "hand");
    const cards = [
      game.debugSpawn("Island", B, "library"),
      game.debugSpawn("Grizzly Bears", B, "library"),
      game.debugSpawn("Island", B, "library"),
    ];
    c[A].chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === cards[1]);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      targets: [{ kind: "player", player: B }],
      modes: [1],
    });
    quiet(game);
    for (const id of cards) expect(game.state.objects[id].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(offers(game, cards[1])).toHaveLength(1);
    expect(offers(game, cards[0])).toHaveLength(0);
  });
});
