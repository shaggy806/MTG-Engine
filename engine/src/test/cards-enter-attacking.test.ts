import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Cards whose tokens enter tapped and attacking (rule 508.4) — see
// enter-attacking.test.ts for the rule itself.

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const mkGame = (players: readonly PlayerId[]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const toPostcombat = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "postcombat-main";
const afterAttackTriggers = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null;

/** Alice's permanent `card`, able to attack, attacking `defender` on turn 1. */
const attackWith = (players: readonly PlayerId[], card: string, defender: PlayerId = B) => {
  const { game, c } = mkGame(players);
  const id = game.debugSpawn(card, A, "battlefield", { summoningSick: false });
  c[A].declareAttackersFn = () => [{ attacker: id, defender }];
  return { game, c, id };
};

describe("tokens that enter tapped and attacking", () => {
  it("Leonin Warleader: two lifelink Cats attack beside it", () => {
    const { game } = attackWith([A, B], "Leonin Warleader");
    game.advanceUntil(afterAttackTriggers);
    const cats = named(game, "Lifelink Cat Token");
    expect(cats).toHaveLength(2);
    expect(cats.every((id) => game.state.objects[id].attacking === B && game.state.objects[id].tapped)).toBe(true);
    const [lifeA, lifeB] = [game.state.players[A].life, game.state.players[B].life];
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(lifeB - 4 - 2);
    expect(game.state.players[A].life).toBe(lifeA + 2);
  });

  it("Hanweir Garrison: two red Humans, and they don't trigger its own attack ability", () => {
    const { game } = attackWith([A, B], "Hanweir Garrison");
    game.advanceUntil(toPostcombat);
    expect(named(game, "Red Human Token")).toHaveLength(2);
    expect(game.state.players[B].life).toBe(40 - 2 - 2);
  });

  it("Adeline: a Human for each opponent, attacking that one, even the ones she didn't attack", () => {
    const { game } = attackWith([A, B, C, D], "Adeline, Resplendent Cathar");
    game.advanceUntil(afterAttackTriggers);
    const humans = named(game, "Human Token");
    expect(humans.map((id) => game.state.objects[id].attacking).sort()).toEqual([B, C, D].sort());
    // Her power counts every creature you control: herself and three Humans.
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(40 - 4 - 1);
    expect(game.state.players[C].life).toBe(40 - 1);
  });

  it("Soaring Lightbringer: one Glimmer per player attacked, at that player", () => {
    const { game, c } = mkGame([A, B, C, D]);
    game.debugSpawn("Soaring Lightbringer", A, "battlefield", { summoningSick: false });
    const bearsB = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const bearsC = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [
      { attacker: bearsB, defender: B },
      { attacker: bearsC, defender: C },
    ];
    game.advanceUntil(afterAttackTriggers);
    const glimmers = named(game, "Glimmer Token");
    expect(glimmers.map((id) => game.state.objects[id].attacking).sort()).toEqual([B, C].sort());
    // "Other enchantment creatures you control have flying."
    expect(game.characteristics(glimmers[0]).keywords).toContain("flying");
  });

  it("Anim Pakal: a counter, then that many Gnomes; Gnomes alone don't trigger it", () => {
    const { game, id } = attackWith([A, B], "Anim Pakal, Thousandth Moon");
    game.advanceUntil(afterAttackTriggers);
    expect(game.state.objects[id].counters["+1/+1"]).toBe(1);
    expect(named(game, "Gnome Token")).toHaveLength(1);
  });

  it("General Kreat: one or more Goblins attacking make one Goblin, which asks whom in multiplayer", () => {
    const { game, c } = attackWith([A, B, C], "General Kreat, the Boltbringer");
    c[A].chooseAttackTargetsFn = (_view, creatures) => creatures.map((cr) => ({ object: cr.object, target: C }));
    game.advanceUntil(afterAttackTriggers);
    const goblins = named(game, "Goblin Token");
    expect(goblins).toHaveLength(1);
    expect(game.state.objects[goblins[0]].attacking).toBe(C);
    // The Goblin entering is "another creature you control enters": 1 to each opponent.
    expect(game.state.players[B].life).toBe(39);
    expect(game.state.players[C].life).toBe(39);
  });
});

describe("cards put onto the battlefield attacking", () => {
  it("Kaalia: an Angel from hand, tapped and attacking the opponent she attacks, no question asked", () => {
    const { game, c } = attackWith([A, B, C], "Kaalia of the Vast", C);
    const angel = game.debugSpawn("Serra Angel", A, "hand");
    c[A].chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === angel);
    c[A].chooseAttackTargetsFn = () => {
      throw new Error("the card names the opponent: nothing to choose");
    };
    game.advanceUntil(afterAttackTriggers);
    const [onField] = named(game, "Serra Angel");
    expect(game.state.objects[onField].attacking).toBe(C);
    expect(game.state.objects[onField].tapped).toBe(true);
    expect(game.state.players[C].life).toBe(40);
    game.advanceUntil(toPostcombat);
    expect(game.state.players[C].life).toBe(40 - 2 - 4);
  });

  it("Kaalia: only an Angel, Demon or Dragon is offered, and attacking a planeswalker doesn't trigger her", () => {
    const { game, c } = mkGame([A, B]);
    const kaalia = game.debugSpawn("Kaalia of the Vast", A, "battlefield", { summoningSick: false });
    const walker = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    game.debugSpawn("Serra Angel", A, "hand");
    let offered = 0;
    c[A].chooseFromZoneFn = (_view, eligible) => {
      offered += 1;
      return eligible;
    };
    c[A].declareAttackersFn = () => [{ attacker: kaalia, defender: walker }];
    game.advanceUntil(afterAttackTriggers);
    expect(offered).toBe(0);
    expect(named(game, "Serra Angel")).toHaveLength(0);
  });

  it("Winota: a Human from the top six enters attacking and indestructible; the rest go to the bottom", () => {
    const { game, c } = mkGame([A, B]);
    game.debugSpawn("Winota, Joiner of Forces", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    // After the turn's draw, which would take it off the top.
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    const human = game.debugSpawn("Skyknight Vanguard", A, "library");
    c[A].chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === human);
    c[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(afterAttackTriggers);
    const [vanguard] = named(game, "Skyknight Vanguard");
    expect(game.state.objects[vanguard].attacking).toBe(B);
    expect(game.characteristics(vanguard).keywords).toContain("indestructible");
    // It entered attacking, so its own "whenever this attacks" never fired.
    expect(named(game, "Soldier Token")).toHaveLength(0);
  });
});

describe("myriad (rule 702.116a)", () => {
  /** Say yes to a myriad copy only for the players in `yes`, recording who
   * each question was about. */
  const answerFor = (c: ScriptedController, yes: readonly PlayerId[], asked: PlayerId[]) => {
    c.chooseModesFn = (view) => {
      const about = view.state.awaiting?.kind === "choose-modes" ? view.state.awaiting.about : undefined;
      if (about !== undefined) asked.push(about);
      return about !== undefined && yes.includes(about) ? [0] : [];
    };
  };

  it("asks about each opponent but the defending one; a copy attacks each yes, and is exiled at end of combat", () => {
    const { game, c } = attackWith([A, B, C, D], "Goldlust Triad", B);
    const asked: PlayerId[] = [];
    answerFor(c[A], [C], asked);
    game.advanceUntil(afterAttackTriggers);
    expect(asked.sort()).toEqual([C, D].sort());
    const triads = named(game, "Goldlust Triad");
    expect(triads).toHaveLength(2);
    const copy = triads.find((id) => game.state.objects[id].isToken)!;
    expect(game.state.objects[copy].attacking).toBe(C);
    expect(game.state.objects[copy].tapped).toBe(true);
    game.advanceUntil(toPostcombat);
    // Both dealt their damage (and made a Treasure each), then the copy went.
    expect(game.state.players[B].life).toBe(36);
    expect(game.state.players[C].life).toBe(36);
    expect(named(game, "Treasure Token")).toHaveLength(2);
    expect(named(game, "Goldlust Triad")).toHaveLength(1);
  });

  it("a creature granted myriad by Legion Loyalty has it; its copies don't trigger it again", () => {
    const { game, c } = attackWith([A, B, C], "Grizzly Bears", B);
    game.debugSpawn("Legion Loyalty", A, "battlefield");
    const asked: PlayerId[] = [];
    answerFor(c[A], [C], asked);
    game.advanceUntil(afterAttackTriggers);
    expect(asked).toEqual([C]);
    const bears = named(game, "Grizzly Bears");
    expect(bears).toHaveLength(2);
    game.advanceUntil(toPostcombat);
    expect(game.state.players[C].life).toBe(38);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
  });

  it("in a two-player game there's nobody else to copy it at", () => {
    const { game, c } = attackWith([A, B], "Goldlust Triad", B);
    const asked: PlayerId[] = [];
    answerFor(c[A], [B], asked);
    game.advanceUntil(toPostcombat);
    expect(asked).toEqual([]);
    expect(named(game, "Goldlust Triad")).toHaveLength(1);
  });
});

describe("commanders that put creatures in attacking", () => {
  it("Najeela: a Warrior attacking may bring a Warrior token, which doesn't trigger her again", () => {
    const { game, c } = attackWith([A, B], "Najeela, the Blade-Blossom");
    c[A].chooseModesFn = () => [0];
    game.advanceUntil(afterAttackTriggers);
    const tokens = named(game, "Warrior Token");
    expect(tokens).toHaveLength(1);
    expect(game.state.objects[tokens[0]].attacking).toBe(B);
  });

  it("Najeela: her ability untaps the attackers, grants three keywords, and adds a combat after this one", () => {
    const { game, id } = attackWith([A, B], "Najeela, the Blade-Blossom");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    game.advanceUntil(afterAttackTriggers);
    expect(game.state.objects[id].tapped).toBe(true);
    const ability = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === id);
    expect(ability).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: id, abilityIndex: 0, targets: [] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.objects[id].tapped).toBe(false);
    expect([...game.characteristics(id).keywords]).toEqual(expect.arrayContaining(["trample", "lifelink", "haste"]));
    const since = game.events.length;
    game.advanceUntil((s) => s.turn.number > 1);
    // Another combat phase after this one, before the turn ends.
    const combats = game.events
      .slice(since)
      .filter((e) => e.type === "step-began" && e.step === "begin-combat");
    expect(combats).toHaveLength(1);
  });

  it("Raph & Mikey: the first creature revealed enters tapped and attacking; the rest go to the bottom", () => {
    const { game, c } = mkGame([A, B]);
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    const raph = game.debugSpawn("Raph & Mikey, Troublemakers", A, "battlefield", { summoningSick: false });
    // Top of the library: a Plains, then a Hill Giant.
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const plains = game.debugSpawn("Plains", A, "library");
    c[A].declareAttackersFn = () => [{ attacker: raph, defender: B }];
    game.advanceUntil(afterAttackTriggers);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].attacking).toBe(B);
    expect(game.state.objects[giant].tapped).toBe(true);
    const library = game.state.zones.perPlayer[A].library;
    expect(library[library.length - 1]).toBe(plains);
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(40 - 7 - 3);
  });
});
