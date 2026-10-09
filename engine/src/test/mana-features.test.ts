/**
 * The cards behind the `add-mana` extensions (`add-mana-extensions.test.ts`
 * has the engine pieces): one focused test per card whose behaviour is more
 * than a stat line, written from its Oracle text and rulings.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import type { ManaType } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const mkGame = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array(40).fill("Island") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s: GameState) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const pool = (game: Game, p: PlayerId = A) => poolCounts(game.state.players[p].manaPool);

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};

type Activate = Extract<LegalAction, { kind: "activate-ability" }>;
const offers = (game: Game, source: ObjectId, abilityIndex?: number): Activate[] =>
  game
    .legalActions(A)
    .filter(
      (a): a is Activate =>
        a.kind === "activate-ability" &&
        a.source === source &&
        (abilityIndex === undefined || a.abilityIndex === abilityIndex),
    );
const picks = (game: Game, source: ObjectId, abilityIndex?: number) =>
  offers(game, source, abilityIndex).map((a) => a.manaColors);

const activate = (
  game: Game,
  source: ObjectId,
  abilityIndex: number,
  opts: { manaColors?: readonly ManaType[]; target?: ObjectId } = {},
): void =>
  void game.dispatch({
    type: "activate-ability",
    player: A,
    source,
    abilityIndex,
    targets: opts.target === undefined ? [] : [{ kind: "object", object: opts.target }],
    ...(opts.manaColors !== undefined ? { manaColors: opts.manaColors } : {}),
  });

const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);

const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};

describe("Reflecting Pool", () => {
  it("taps for any type a land you control could produce", () => {
    const game = mkGame();
    const reflecting = spawn(game, "Reflecting Pool");
    spawn(game, "Simic Guildgate");
    expect(picks(game, reflecting)).toEqual([["U"], ["G"]]);
  });
});

describe("Horizon of Progress", () => {
  it("pays 1 life for a type your other lands could produce", () => {
    const game = mkGame();
    const horizon = spawn(game, "Horizon of Progress");
    spawn(game, "Forest");
    expect(picks(game, horizon, 0)).toEqual([["G"]]);
    const life = game.state.players[A].life;
    activate(game, horizon, 0, { manaColors: ["G"] });
    expect(pool(game).G).toBe(1);
    expect(game.state.players[A].life).toBe(life - 1);
  });

  it("puts a land card from your hand onto the battlefield tapped", () => {
    const game = mkGame();
    const horizon = spawn(game, "Horizon of Progress");
    lands(game, "Swamp", 3);
    const land = game.debugSpawn("Forest", A, "hand");
    activate(game, horizon, 1);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [land] });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
  });
});

describe("Incubation Druid", () => {
  it("makes one of a land's types, or three of one type with a +1/+1 counter on it", () => {
    const game = mkGame();
    const druid = spawn(game, "Incubation Druid");
    spawn(game, "Forest");
    spawn(game, "Island");
    expect(picks(game, druid, 0)).toEqual([["U"], ["G"]]);
    game.state.objects[druid].counters["+1/+1"] = 1;
    expect(picks(game, druid, 0)).toEqual([
      ["U", "U", "U"],
      ["G", "G", "G"],
    ]);
    activate(game, druid, 0, { manaColors: ["G", "G", "G"] });
    expect(pool(game)).toMatchObject({ G: 3, U: 0 });
  });
});

describe("Gond Gate", () => {
  it("taps for a colour a Gate you control could produce, and Gates enter untapped", () => {
    const game = mkGame();
    const gond = spawn(game, "Gond Gate");
    spawn(game, "Forest"); // not a Gate
    expect(picks(game, gond, 1)).toEqual([[]]);
    const gate = game.debugSpawn("Azorius Guildgate", A, "battlefield");
    expect(game.state.objects[gate].tapped).toBe(false);
    expect(picks(game, gond, 1)).toEqual([["W"], ["U"]]);
  });
});

describe("Mox Amber", () => {
  it("counts a legendary creature's and a planeswalker's colours, not a nonlegendary creature's", () => {
    const game = mkGame();
    const mox = spawn(game, "Mox Amber");
    spawn(game, "Llanowar Elves");
    expect(picks(game, mox)).toEqual([[]]);
    spawn(game, "Kinnan, Bonder Prodigy");
    spawn(game, "Ajani, Caller of the Pride");
    expect(picks(game, mox)).toEqual([["W"], ["U"], ["G"]]);
  });
});

describe("The Grey Havens", () => {
  it("taps for a colour among legendary creature cards in your graveyard", () => {
    const game = mkGame();
    const havens = spawn(game, "The Grey Havens");
    game.debugSpawn("Teysa Karlov", A, "graveyard");
    game.debugSpawn("Kinnan, Bonder Prodigy", B, "graveyard"); // not yours
    game.debugSpawn("Grizzly Bears", A, "graveyard"); // not legendary
    expect(picks(game, havens, 1)).toEqual([["W"], ["B"]]);
  });
});

describe("Plaza of Heroes", () => {
  it("makes mana only a legendary spell can spend, and mana of a legendary permanent's colour", () => {
    const game = mkGame();
    const plaza = spawn(game, "Plaza of Heroes");
    activate(game, plaza, 1, { manaColors: ["G"] });
    expect(game.state.players[A].manaPool[0].restriction?.spell).toEqual({ supertype: "legendary" });
    const second = spawn(game, "Plaza of Heroes");
    spawn(game, "Teysa Karlov");
    expect(picks(game, second, 2)).toEqual([["W"], ["B"]]);
  });

  it("exiles itself to give a legendary creature hexproof and indestructible", () => {
    const game = mkGame();
    const plaza = spawn(game, "Plaza of Heroes");
    lands(game, "Swamp", 3);
    const teysa = spawn(game, "Teysa Karlov", B);
    activate(game, plaza, 3, { target: teysa });
    expect(game.state.objects[plaza].zone).toBe("exile");
    game.advanceUntil(quiet);
    const keywords = computeCharacteristics(game.state, registry, teysa).keywords;
    expect(keywords.has("hexproof")).toBe(true);
    expect(keywords.has("indestructible")).toBe(true);
  });
});

describe("Bloom Tender", () => {
  it("makes only the colours among your permanents — just {G} on its own", () => {
    const game = mkGame();
    const tender = spawn(game, "Bloom Tender");
    activate(game, tender, 0);
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G"]);
  });
});

describe("Faeburrow Elder", () => {
  it("gets +1/+1 and makes a mana for each colour among your permanents", () => {
    const game = mkGame();
    const elder = spawn(game, "Faeburrow Elder");
    const pt = () => {
      const c = computeCharacteristics(game.state, registry, elder);
      return [c.power, c.toughness];
    };
    expect(pt()).toEqual([2, 2]);
    spawn(game, "Teysa Karlov");
    expect(pt()).toEqual([3, 3]);
    activate(game, elder, 0);
    expect(pool(game)).toEqual({ W: 1, U: 0, B: 1, R: 0, G: 1, C: 0 });
  });
});

describe("Nykthos, Shrine to Nyx", () => {
  it("adds mana of the chosen colour equal to your devotion to it, Nykthos's {2} paid", () => {
    const game = mkGame();
    const nykthos = spawn(game, "Nykthos, Shrine to Nyx");
    spawn(game, "Kinnan, Bonder Prodigy"); // {G}{U}
    spawn(game, "Llanowar Elves"); // {G}
    lands(game, "Swamp", 2);
    expect(picks(game, nykthos, 1)).toEqual([["U"], ["G", "G"], []]);
    activate(game, nykthos, 1, { manaColors: ["G", "G"] });
    expect(pool(game)).toMatchObject({ G: 2, B: 0 });
  });
});

describe("Nyx Lotus", () => {
  it("enters tapped, and taps for devotion to the chosen colour", () => {
    const game = mkGame();
    const lotus = game.debugSpawn("Nyx Lotus", A, "battlefield");
    expect(game.state.objects[lotus].tapped).toBe(true);
    game.state.objects[lotus].tapped = false;
    spawn(game, "Gray Merchant of Asphodel");
    expect(picks(game, lotus)).toEqual([["B", "B"], []]);
    activate(game, lotus, 0, { manaColors: ["B", "B"] });
    expect(pool(game).B).toBe(2);
  });
});

describe("Three Tree City", () => {
  it("adds one colour, as much as you have creatures of the chosen type", () => {
    const game = mkGame();
    const city = spawn(game, "Three Tree City");
    game.state.objects[city].chosenCreatureType = "Bear";
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Llanowar Elves");
    lands(game, "Swamp", 2);
    const options = picks(game, city, 1);
    expect(options).toHaveLength(5);
    expect(options[4]).toEqual(["G", "G"]);
    activate(game, city, 1, { manaColors: ["R", "R"] });
    expect(pool(game)).toMatchObject({ R: 2, B: 0 });
  });
});

describe("Culling Ritual", () => {
  it("destroys each nonland permanent of mana value 2 or less, and asks the {B}/{G} split", () => {
    const game = mkGame();
    spawn(game, "Swamp");
    spawn(game, "Forest");
    lands(game, "Island", 2);
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears", B);
    const relic = spawn(game, "Darksteel Relic"); // indestructible: not destroyed
    const merchant = spawn(game, "Gray Merchant of Asphodel", B);
    const ritual = game.debugSpawn("Culling Ritual", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: ritual, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-modes" && awaiting.modes.map((m) => m.text)).toEqual([
      "Add {B}{B}.",
      "Add {B}{G}.",
      "Add {G}{G}.",
    ]);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil(quiet);
    expect(pool(game)).toMatchObject({ B: 1, G: 1 });
    expect(game.state.objects[elves].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[relic].zone).toBe("battlefield");
    expect(game.state.objects[merchant].zone).toBe("battlefield");
  });
});

describe("Deathrite Shaman", () => {
  it("exiles an instant or sorcery card from a graveyard to drain each opponent 2", () => {
    const game = mkGame();
    const shaman = spawn(game, "Deathrite Shaman");
    spawn(game, "Swamp");
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    activate(game, shaman, 1, { target: bolt });
    game.advanceUntil(quiet);
    expect(game.state.objects[bolt].zone).toBe("exile");
    expect(game.state.players[B].life).toBe(18);
  });

  it("exiles a creature card from a graveyard to gain 2 life", () => {
    const game = mkGame();
    const shaman = spawn(game, "Deathrite Shaman");
    spawn(game, "Forest");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    activate(game, shaman, 2, { target: bears });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.players[A].life).toBe(22);
  });

  it("isn't a mana ability: no colour is offered as it's activated", () => {
    const game = mkGame();
    const shaman = spawn(game, "Deathrite Shaman");
    game.debugSpawn("Forest", B, "graveyard");
    const first = offers(game, shaman, 0);
    expect(first).toHaveLength(1);
    expect(first[0].manaColors).toBeUndefined();
    expect(first[0].manaAbility).toBeUndefined();
  });
});

describe("Mirari's Wake", () => {
  it("gives your creatures +1/+1 and a basic land an extra mana of its type", () => {
    const game = mkGame();
    spawn(game, "Mirari's Wake");
    const bears = spawn(game, "Grizzly Bears");
    expect(computeCharacteristics(game.state, registry, bears).power).toBe(3);
    const forest = spawn(game, "Forest");
    activate(game, forest, 0);
    expect(pool(game).G).toBe(2);
  });
});

describe("Zendikar Resurgent", () => {
  it("adds a mana of the type a land made, and draws a card when you cast a creature spell", () => {
    const game = mkGame();
    spawn(game, "Zendikar Resurgent");
    spawn(game, "Forest");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const hand = game.handOf(A).length;
    // One Forest makes {G}{G}: enough for {1}{G}.
    expect(castable(game, bears)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    game.advanceUntil(quiet);
    // The Bears left the hand; the trigger drew one back.
    expect(game.handOf(A).length).toBe(hand);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("Mana Flare", () => {
  it("gives whoever taps a land the extra mana — an opponent's Mana Flare too", () => {
    const game = mkGame();
    spawn(game, "Mana Flare", B);
    const forest = spawn(game, "Forest");
    activate(game, forest, 0);
    expect(pool(game).G).toBe(2);
    expect(pool(game, B).G).toBe(0);
  });
});

describe("Heartbeat of Spring", () => {
  it("doubles a land's mana for its controller", () => {
    const game = mkGame();
    spawn(game, "Heartbeat of Spring");
    const swamp = spawn(game, "Swamp");
    activate(game, swamp, 0);
    expect(pool(game).B).toBe(2);
  });
});

describe("Kinnan, Bonder Prodigy", () => {
  it("adds a mana of a type a nonland permanent made — the pick the player's off a Signet", () => {
    const game = mkGame();
    spawn(game, "Kinnan, Bonder Prodigy");
    const signet = spawn(game, "Azorius Signet");
    spawn(game, "Swamp");
    expect(picks(game, signet)).toEqual([["W"], ["U"]]);
    activate(game, signet, 0, { manaColors: ["W"] });
    expect(pool(game)).toMatchObject({ W: 2, U: 1, B: 0 });
  });

  it("adds the extra mana off a Treasure sacrificed for its own mana", () => {
    const game = mkGame();
    spawn(game, "Kinnan, Bonder Prodigy");
    const treasure = game.debugSpawn("Treasure Token", A, "battlefield");
    expect(picks(game, treasure)).toEqual([["W"], ["U"], ["B"], ["R"], ["G"]]);
    activate(game, treasure, 0, { manaColors: ["R"] });
    expect(pool(game).R).toBe(2);
  });

  it("doesn't touch a land, and the auto-payer counts the extra mana", () => {
    const game = mkGame();
    spawn(game, "Kinnan, Bonder Prodigy");
    const forest = spawn(game, "Forest");
    activate(game, forest, 0);
    expect(pool(game).G).toBe(1);
    const game2 = mkGame();
    spawn(game2, "Kinnan, Bonder Prodigy");
    spawn(game2, "Llanowar Elves");
    const bears = game2.debugSpawn("Grizzly Bears", A, "hand");
    expect(castable(game2, bears)).toBe(true);
  });

  it("puts a non-Human creature card from the top five onto the battlefield", () => {
    const game = mkGame();
    const kinnan = spawn(game, "Kinnan, Bonder Prodigy");
    spawn(game, "Forest");
    spawn(game, "Island");
    lands(game, "Swamp", 5);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    activate(game, kinnan, 0);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("Fertile Ground", () => {
  it("the auto-payer makes its extra mana whatever colour the cost wants", () => {
    const game = mkGame();
    const forest = spawn(game, "Forest");
    const ground = game.debugSpawn("Fertile Ground", A, "battlefield");
    game.state.objects[ground].attachedTo = forest;
    const card = game.debugSpawn("Expressive Iteration", A, "hand"); // {U}{R}
    expect(castable(game, card)).toBe(false);
    const seastrider = game.debugSpawn("Phantasmal Image", A, "hand"); // {1}{U}
    expect(castable(game, seastrider)).toBe(true);
  });
});

describe("Mana Reflection", () => {
  it("doubles the mana of a permanent you tap for it", () => {
    const game = mkGame();
    spawn(game, "Mana Reflection");
    const signet = spawn(game, "Azorius Signet");
    spawn(game, "Swamp");
    activate(game, signet, 0);
    expect(pool(game)).toMatchObject({ W: 2, U: 2 });
  });
});

describe("Nyxbloom Ancient", () => {
  it("triples it", () => {
    const game = mkGame();
    spawn(game, "Nyxbloom Ancient");
    const forest = spawn(game, "Forest");
    activate(game, forest, 0);
    expect(pool(game).G).toBe(3);
  });
});

describe("Chrome Mox", () => {
  it("imprints a nonartifact, nonland card from hand face up and taps for one of its colours", () => {
    const game = mkGame();
    const mox = game.debugSpawn("Chrome Mox", A, "hand");
    const charm = game.debugSpawn("Izzet Charm", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: mox, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const awaiting = game.state.awaiting;
    // Lands and artifacts aren't on offer.
    expect(awaiting?.kind === "choose-from-zone" && awaiting.eligible).toEqual([charm]);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [charm] });
    game.advanceUntil(quiet);
    expect(game.state.objects[charm].zone).toBe("exile");
    expect(game.state.objects[charm].exiledFaceDown).toBeUndefined();
    expect(picks(game, mox)).toEqual([["U"], ["R"]]);
    // Another Chrome Mox has nothing linked to it.
    const other = spawn(game, "Chrome Mox");
    expect(picks(game, other)).toEqual([[]]);
  });

  it("makes no mana with nothing imprinted", () => {
    const game = mkGame();
    const mox = spawn(game, "Chrome Mox");
    activate(game, mox, 0, { manaColors: [] });
    expect(game.state.players[A].manaPool).toHaveLength(0);
  });
});

describe("Utopia Sprawl", () => {
  it("adds a mana of the colour chosen as it entered whenever the enchanted Forest taps — for the auto-payer too", () => {
    const game = mkGame();
    const forest = spawn(game, "Forest");
    const sprawl = game.debugSpawn("Utopia Sprawl", A, "battlefield");
    game.state.objects[sprawl].attachedTo = forest;
    game.state.objects[sprawl].chosenOnEnter = "U";
    const image = game.debugSpawn("Phantasmal Image", A, "hand"); // {1}{U}
    expect(castable(game, image)).toBe(true);
    activate(game, forest, 0);
    expect(pool(game)).toMatchObject({ G: 1, U: 1 });
  });
});

describe("Burnt Offering", () => {
  it("adds the sacrificed creature's mana value in a split of {B} and {R} the player picks", () => {
    const game = mkGame();
    spawn(game, "Swamp");
    const merchant = spawn(game, "Gray Merchant of Asphodel"); // mana value 5
    const offering = game.debugSpawn("Burnt Offering", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: offering, targets: [], sacrifice: merchant });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-modes" && awaiting.modes).toHaveLength(6);
    game.dispatch({ type: "choose-modes", player: A, modes: [2] });
    game.advanceUntil(quiet);
    expect(pool(game)).toMatchObject({ B: 3, R: 2 });
  });
});

describe("Gwenna, Eyes of Gaea", () => {
  it("taps for two mana in any split, for creatures only", () => {
    const game = mkGame();
    const gwenna = spawn(game, "Gwenna, Eyes of Gaea");
    expect(picks(game, gwenna)).toHaveLength(15);
    activate(game, gwenna, 0, { manaColors: ["B", "G"] });
    expect(pool(game)).toMatchObject({ B: 1, G: 1 });
    expect(game.state.players[A].manaPool.every((u) => u.restriction?.spell?.type === "creature")).toBe(true);
  });

  it("untaps with a +1/+1 counter for a creature spell of power 5 or more, not less", () => {
    const game = mkGame();
    const gwenna = spawn(game, "Gwenna, Eyes of Gaea");
    game.state.objects[gwenna].tapped = true;
    lands(game, "Swamp", 5);
    const merchant = game.debugSpawn("Gray Merchant of Asphodel", A, "hand"); // 2/4
    game.dispatch({ type: "cast-spell", player: A, card: merchant, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[gwenna].tapped).toBe(true);
    expect(game.state.objects[gwenna].counters["+1/+1"] ?? 0).toBe(0);
    lands(game, "Forest", 6);
    const tyrranax = game.debugSpawn("Alpha Tyrranax", A, "hand"); // 6/5
    game.dispatch({ type: "cast-spell", player: A, card: tyrranax, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[gwenna].tapped).toBe(false);
    expect(game.state.objects[gwenna].counters["+1/+1"]).toBe(1);
  });
});

describe("Cactus Preserve", () => {
  it("taps for a type your lands could produce, and becomes an X/X Plant for your commanders' greatest mana value", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [
        { player: A, cards: Array(40).fill("Island"), commanders: ["Klauth, Unrivaled Ancient"] },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s: GameState) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const cactus = game.debugSpawn("Cactus Preserve", A, "battlefield");
    expect(game.state.objects[cactus].tapped).toBe(true);
    game.state.objects[cactus].tapped = false;
    spawn(game, "Forest");
    expect(picks(game, cactus, 0)).toEqual([["G"]]);
    lands(game, "Swamp", 3);
    activate(game, cactus, 1);
    game.advanceUntil(quiet);
    const c = computeCharacteristics(game.state, registry, cactus);
    // Klauth's mana value is 7, from the command zone.
    expect([c.power, c.toughness]).toEqual([7, 7]);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect([...c.colors]).toEqual(["G"]);
    expect(c.keywords.has("reach")).toBe(true);
  });
});

describe("Klauth, Unrivaled Ancient", () => {
  it("adds the attackers' total power in a split asked as it resolves, for spells only, kept through the turn", () => {
    const a = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Island") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s: GameState) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const klauth = spawn(game, "Klauth, Unrivaled Ancient");
    a.declareAttackersFn = () => [{ attacker: klauth, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "split-mana");
    // Four units over five colours are 70 splits: one decision of how many
    // of each.
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "split-mana" && [awaiting.colors, awaiting.amount]).toEqual([["W", "U", "B", "R", "G"], 4]);
    game.dispatch({ type: "split-mana", player: A, counts: { G: 2, R: 1, W: 1 } });
    expect(pool(game)).toMatchObject({ G: 2, R: 1, W: 1 });
    expect(game.state.players[A].manaPool.every((u) => u.persists === true && u.restriction !== undefined)).toBe(true);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[A].manaPool).toHaveLength(4);
  });
});
