/**
 * Top-5000 batch 5 (ranks 174–1135, 51 cards) and what it needed: the
 * Enduring cycle's return "as an enchantment" (`put-onto-battlefield`'s
 * `setTypes`), attaching an Equipment other than the source (`attach`'s
 * `attachment`), an amount chosen by a condition (`ifCondition` — the Urza's
 * lands), "a target was chosen" (`target-chosen` — The Earth Crystal), mana
 * that pays only for abilities of creature *permanents* (Castle Garenbrig),
 * and a check land that doesn't count lands entering beside it. One test per
 * clause most likely to be wrong.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = [], library = "Wastes") => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Put a permanent into its owner's graveyard the way a dying one goes. */
const kill = (game: Game, id: ObjectId): void => {
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, "graveyard");
};
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((u) => u.type);
/** Answer every `choose-targets` with the given slots, and every "you may"
 * with yes, until nothing is left to resolve. Any other question (declaring
 * attackers, when a trigger is still waiting as combat begins) is left to
 * the scripted controllers, so a pending trigger is never mistaken for one
 * that didn't fire. */
const settle = (game: Game, targets?: readonly (ObjectId | null)[]): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes");
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-targets" && targets !== undefined) {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: targets.map((t) => (t === null ? null : { kind: "object", object: t })),
      });
    } else if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      return;
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-5000 batch 5 — the Enduring cycle", () => {
  it("Enduring Innocence returns as an enchantment only, and doesn't come back a second time", () => {
    const game = setUp();
    const warden = spawn(game, "Soul Warden"); // "whenever another creature enters, you gain 1 life"
    const innocence = spawn(game, "Enduring Innocence");
    const life = game.state.players[A].life;
    kill(game, innocence);
    settle(game);
    const back = game.state.objects[innocence];
    expect(back.zone).toBe("battlefield");
    const c = game.characteristics(innocence);
    expect(c.types).toEqual(["enchantment"]);
    // Sheep and Glimmer went with the creature type (the ruling).
    expect(c.subtypes).toEqual([]);
    // It entered as an enchantment: a creature-enters watcher never saw it.
    expect(game.state.players[A].life).toBe(life);
    expect(game.state.objects[warden].zone).toBe("battlefield");
    // As an enchantment it goes to the graveyard for good.
    kill(game, innocence);
    settle(game);
    expect(game.state.objects[innocence].zone).toBe("graveyard");
  });

  it("Enduring Innocence draws once for a batch of small creatures, once a turn", () => {
    const game = setUp();
    spawn(game, "Enduring Innocence");
    const hand = game.handOf(A).length;
    enter(game, "Grizzly Bears");
    settle(game);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Enduring Tenacity: gaining life makes the target opponent lose that much", () => {
    const game = setUp();
    spawn(game, "Enduring Tenacity");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    settle(game, [null]);
    // The only opponent is the one legal target, chosen for us.
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 3);
  });

  it("Enduring Vitality still lends its mana ability once it's an enchantment", () => {
    const game = setUp();
    const vitality = spawn(game, "Enduring Vitality");
    const bears = spawn(game, "Grizzly Bears");
    kill(game, vitality);
    settle(game);
    expect(game.characteristics(vitality).types).toEqual(["enchantment"]);
    const offers = game.legalActions(A).filter((x) => x.kind === "activate-ability");
    expect(offers.some((x) => x.kind === "activate-ability" && x.source === bears)).toBe(true);
    expect(offers.some((x) => x.kind === "activate-ability" && x.source === vitality)).toBe(false);
  });
});

describe("top-5000 batch 5 — lands", () => {
  it("Mystic Sanctuary: untapped with three other Islands, and tapping it in response doesn't undo the trigger", () => {
    const game = setUp();
    lands(game, "Island", 3);
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const sanctuary = enter(game, "Mystic Sanctuary");
    expect(game.state.objects[sanctuary].tapped).toBe(false);
    // The Bolt is its only legal target, so the trigger goes straight on the
    // stack aimed at it.
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.priority.holder === A);
    // Tapped for mana with the trigger on the stack: it isn't an
    // intervening-if, so it still resolves.
    const tap = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === sanctuary);
    if (tap?.kind === "activate-ability") {
      game.dispatch({ type: "activate-ability", player: A, source: sanctuary, abilityIndex: tap.abilityIndex, targets: [] });
    }
    expect(game.state.objects[sanctuary].tapped).toBe(true);
    settle(game);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(bolt);
  });

  it("Mystic Sanctuary enters tapped beside three Islands entering with it, and doesn't trigger", () => {
    const game = setUp([], "Island");
    const sanctuary = game.debugSpawn("Mystic Sanctuary", A, "library");
    const islands = game.state.zones.perPlayer[A].library.filter((id) => game.state.objects[id].cardName === "Island").slice(0, 3);
    // One search, four finds: they enter the battlefield together.
    game.debugApplyEffect(A, { kind: "search-library", filter: { type: "land" }, destination: "battlefield", min: 0, max: 4 });
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [...islands, sanctuary] });
    game.advanceUntil(quiet);
    expect(game.state.objects[sanctuary].zone).toBe("battlefield");
    expect(game.state.objects[sanctuary].tapped).toBe(true);
  });

  it("Urza's Tower taps for one alone, three beside a Mine and a Power-Plant", () => {
    const game = setUp();
    const tower = spawn(game, "Urza's Tower");
    game.dispatch({ type: "activate-ability", player: A, source: tower, abilityIndex: 0, targets: [] });
    expect(pool(game)).toEqual(["C"]);
    spawn(game, "Urza's Mine");
    spawn(game, "Urza's Power Plant");
    game.state.objects[tower].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: tower, abilityIndex: 0, targets: [] });
    expect(pool(game)).toEqual(["C", "C", "C", "C"]);
  });

  it("the auto-payer counts the assembled Tron: seven mana from three lands", () => {
    const game = setUp(["Darksteel Gargoyle"]); // {7}
    spawn(game, "Urza's Tower");
    spawn(game, "Urza's Mine");
    spawn(game, "Urza's Power Plant");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === "Darksteel Gargoyle")).toBe(true);
  });

  it("Castle Garenbrig's six pay for a creature spell but not a creature card's ability from the graveyard", () => {
    const game = setUp(["Craw Wurm"]);
    lands(game, "Forest", 4);
    const castle = spawn(game, "Castle Garenbrig");
    game.debugSpawn("Bramble Wurm", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: castle, abilityIndex: 1, targets: [] });
    expect(pool(game)).toHaveLength(6);
    const actions = game.legalActions(A);
    // Bramble Wurm's "{2}{G}, Exile this card from your graveyard" is an
    // ability of a creature *card*, not a creature (the ruling).
    expect(actions.some((x) => x.kind === "activate-ability" && x.cardName === "Bramble Wurm")).toBe(false);
    expect(actions.some((x) => x.kind === "cast-spell" && x.cardName === "Craw Wurm")).toBe(true);
  });

  it("Secluded Courtyard's mana still reaches a creature source's ability from the graveyard", () => {
    const game = setUp();
    const courtyard = spawn(game, "Secluded Courtyard");
    game.state.objects[courtyard].chosenCreatureType = "Wurm";
    lands(game, "Wastes", 2);
    game.debugSpawn("Bramble Wurm", A, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: courtyard,
      abilityIndex: 1,
      targets: [],
      manaColors: ["G"],
    });
    expect(game.legalActions(A).some((x) => x.kind === "activate-ability" && x.cardName === "Bramble Wurm")).toBe(true);
  });
});

describe("top-5000 batch 5 — counters, attachments, copies", () => {
  it("The Earth Crystal: two targets get one counter each, doubled; an illegal one doesn't pass its counter on", () => {
    const game = setUp();
    const crystal = spawn(game, "The Earth Crystal");
    lands(game, "Forest", 6);
    const bears = spawn(game, "Grizzly Bears");
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: crystal,
      abilityIndex: 0,
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: wurm },
      ],
    });
    // The Wurm leaves in response: the Bears keep just their share.
    kill(game, wurm);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
  });

  it("The Earth Crystal: one target gets both counters, doubled to four", () => {
    const game = setUp();
    const crystal = spawn(game, "The Earth Crystal");
    lands(game, "Forest", 6);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: crystal,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }, null],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(4);
  });

  it("Hammer of Nazahn attaches another Equipment that enters to the chosen creature", () => {
    const game = setUp();
    spawn(game, "Hammer of Nazahn");
    const bears = spawn(game, "Grizzly Bears");
    const greaves = enter(game, "Lightning Greaves");
    settle(game, [bears]);
    expect(game.state.objects[greaves].attachedTo).toBe(bears);
  });

  it("Hammer of Nazahn attaches itself as it enters", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const hammer = enter(game, "Hammer of Nazahn");
    settle(game, [bears]);
    expect(game.state.objects[hammer].attachedTo).toBe(bears);
    const c = game.characteristics(bears);
    expect(c.power).toBe(4);
    expect(c.keywords.has("indestructible")).toBe(true);
  });

  it("Gyre Sage evolves off a bigger creature, not a smaller one, and taps for its counters", () => {
    const game = setUp();
    const sage = spawn(game, "Gyre Sage");
    enter(game, "Llanowar Elves"); // 1/1: neither bigger
    settle(game);
    expect(game.state.objects[sage].counters["+1/+1"] ?? 0).toBe(0);
    enter(game, "Grizzly Bears"); // 2/2
    settle(game);
    expect(game.state.objects[sage].counters["+1/+1"]).toBe(1);
    game.dispatch({ type: "activate-ability", player: A, source: sage, abilityIndex: 0, targets: [] });
    expect(pool(game)).toEqual(["G"]);
  });

  it("Mossborn Hydra enters with a counter and doubles its +1/+1 counters on landfall", () => {
    const game = setUp();
    const hydra = spawn(game, "Mossborn Hydra");
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(1);
    enter(game, "Forest");
    game.advanceUntil(quiet);
    enter(game, "Forest");
    game.advanceUntil(quiet);
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(4);
  });

  it("Scrap Trawler returns only an artifact card of lesser mana value", () => {
    const game = setUp();
    const trawler = spawn(game, "Scrap Trawler"); // mana value 3
    const cheap = game.debugSpawn("Sol Ring", A, "graveyard"); // 1
    const same = game.debugSpawn("Mind Stone", A, "graveyard"); // 2
    const dear = game.debugSpawn("Commander's Sphere", A, "graveyard"); // 3
    kill(game, trawler);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    const awaiting = game.state.awaiting;
    const offered = awaiting?.kind === "choose-targets" ? awaiting.options[0].flatMap((r) => (r.kind === "object" ? [r.object] : [])) : [];
    expect(offered).toEqual(expect.arrayContaining([cheap, same]));
    expect(offered).not.toContain(dear);
  });

  it("Cloud Key reduces only the chosen type", () => {
    const game = setUp(["Lightning Strike", "Grizzly Bears"]);
    const key = spawn(game, "Cloud Key");
    game.state.objects[key].chosenOnEnter = "instant";
    lands(game, "Mountain", 1);
    spawn(game, "Forest");
    const castable = (name: string) => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === name);
    // {1}{R} on a Mountain and a Forest's worth: the instant costs {R}.
    game.state.objects[game.battlefield.find((id) => game.state.objects[id].cardName === "Forest")!].tapped = true;
    expect(castable("Lightning Strike")).toBe(true);
    expect(castable("Grizzly Bears")).toBe(false);
  });
});

describe("top-5000 batch 5 — the rest", () => {
  it("Elspeth, Storm Slayer's +1 makes two Soldiers; her 0 counters and flies everything you control", () => {
    const game = setUp();
    const elspeth = spawn(game, "Elspeth, Storm Slayer");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: elspeth, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    const soldiers = named(game, "Soldier Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(soldiers).toBe(2);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({ type: "activate-ability", player: A, source: elspeth, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(bears).keywords.has("flying")).toBe(true);
  });

  it("Bloodchief Ascension: a quest counter only after an opponent lost 2, and a drain at three", () => {
    const game = setUp();
    const ascension = spawn(game, "Bloodchief Ascension");
    game.advanceUntil((s) => s.turn.step === "end");
    settle(game);
    expect(game.state.objects[ascension].counters.quest ?? 0).toBe(0);
    game.state.objects[ascension].counters.quest = 3;
    const bLife = game.state.players[B].life;
    const aLife = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 1 });
    settle(game);
    expect(game.state.players[B].life).toBe(bLife - 2);
    expect(game.state.players[A].life).toBe(aLife + 2);
  });

  it("Ashaya is a Forest among lands and counts the creatures it made lands", () => {
    const game = setUp();
    const ashaya = spawn(game, "Ashaya, Soul of the Wild");
    lands(game, "Wastes", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
    const token = named(game, "Soldier Token")[0];
    // Two Wastes, the Bears and Ashaya itself; the token stays a creature.
    expect(game.characteristics(ashaya)).toMatchObject({ power: 4, toughness: 4 });
    expect(game.characteristics(bears).types).toEqual(expect.arrayContaining(["creature", "land"]));
    expect(game.characteristics(bears).subtypes).toContain("Forest");
    expect(game.characteristics(token).types).not.toContain("land");
  });

  it("Twinflame Tyrant doubles damage to an opponent, not to its controller's own creature", () => {
    const game = setUp();
    spawn(game, "Twinflame Tyrant");
    const mine = spawn(game, "Craw Wurm");
    const source = spawn(game, "Grizzly Bears");
    const life = game.state.players[B].life;
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source });
    game.debugApplyEffect(A, { kind: "damage", amount: 2, target: 0 }, [{ kind: "object", object: mine }], { source });
    expect(game.state.players[B].life).toBe(life - 4);
    expect(game.state.objects[mine].damageMarked).toBe(2);
  });

  it("Terrasymbiosis draws as many cards as counters were put on, once a turn", () => {
    const game = setUp();
    spawn(game, "Terrasymbiosis");
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 }, [{ kind: "object", object: bears }]);
    settle(game);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 3);
  });

  it("Lion's Eye Diamond discards the hand for three of one colour, and the auto-payer leaves it alone", () => {
    const game = setUp(["Grizzly Bears", "Lightning Bolt"]);
    const led = spawn(game, "Lion's Eye Diamond");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === "Grizzly Bears")).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: led, abilityIndex: 0, targets: [], manaColors: ["B"] });
    expect(game.handOf(A)).toHaveLength(0);
    expect(pool(game)).toEqual(["B", "B", "B"]);
  });

  it("Evolution Witness adapts only without counters, and each time counters land it returns a permanent card", () => {
    const game = setUp();
    const witness = spawn(game, "Evolution Witness");
    lands(game, "Forest", 4);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: witness, abilityIndex: 0, targets: [] });
    settle(game, [bears]);
    expect(game.state.objects[witness].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[bears].zone).toBe("hand");
    game.dispatch({ type: "activate-ability", player: A, source: witness, abilityIndex: 0, targets: [] });
    settle(game);
    expect(game.state.objects[witness].counters["+1/+1"]).toBe(2);
  });

  it("Descent into Avernus counts the counters it just got: two Treasures and 2 damage each", () => {
    const game = setUp();
    spawn(game, "Descent into Avernus");
    const [aLife, bLife] = [game.state.players[A].life, game.state.players[B].life];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    settle(game);
    game.advanceUntil(quiet);
    const treasures = (p: PlayerId) =>
      named(game, "Treasure Token")
        .filter((id) => game.state.objects[id].controller === p)
        .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(treasures(A)).toBe(2);
    expect(treasures(B)).toBe(2);
    expect(game.state.players[A].life).toBe(aLife - 2);
    expect(game.state.players[B].life).toBe(bLife - 2);
  });
});
