import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { parseManaCost } from "./mana.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (aCards: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

/** Put a land on the battlefield untapped (bypassing its enters-tapped clause). */
const land = (game: Game, name: string): ObjectId => {
  const id = game.debugSpawn(name, A);
  game.state.objects[id]!.tapped = false;
  return id;
};

/** Can A currently pay `cost` from mana sources? (white-box — the planner). */
const canPay = (game: Game, cost: string): boolean =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (game as any).payMana(A, parseManaCost(cost)) !== null;

const canCast = (game: Game, cardName: string): boolean =>
  game
    .legalActions(A)
    .some(
      (a) =>
        a.kind === "cast-spell" && game.state.objects[a.card]?.cardName === cardName,
    );

describe("fixed multi-color mana sources (P0)", () => {
  it("a dual land can pay for either of its colors, but not a third", () => {
    const game = makeGame(["Raging Goblin", "Llanowar Elves", "Opt"]);
    land(game, "Temple of Abandon"); // {T}: Add {R} or {G}

    expect(canCast(game, "Raging Goblin")).toBe(true); //  {R}
    expect(canCast(game, "Llanowar Elves")).toBe(true); // {G}
    expect(canCast(game, "Opt")).toBe(false); //           {U}
  });

  it("two duals cover a two-of-one-color cost, but not a color only one makes", () => {
    const game = makeGame([]);
    land(game, "Temple of Mystery"); // {G} or {U}
    land(game, "Temple of Abandon"); // {R} or {G}

    expect(canPay(game, "{G}{G}")).toBe(true); //  G + G
    expect(canPay(game, "{U}{U}")).toBe(false); // only one U source
    expect(canPay(game, "{R}{U}")).toBe(true); //  Abandon->R, Mystery->U
  });

  it("the dual is spent on the color a basic can't make", () => {
    const game = makeGame([]);
    land(game, "Temple of Abandon"); // {R} or {G}
    land(game, "Forest"); //            {G}

    expect(canPay(game, "{R}{G}")).toBe(true); //  Forest->G, Temple->R
    expect(canPay(game, "{R}{R}")).toBe(false); // only one R source
    expect(canPay(game, "{1}{G}")).toBe(true);
  });

  it("a triland taps for any one of its three colors", () => {
    const game = makeGame([]);
    land(game, "Frontier Bivouac"); // {T}: Add {G}, {U}, or {R}

    for (const c of ["{G}", "{U}", "{R}"]) expect(canPay(game, c)).toBe(true);
    expect(canPay(game, "{W}")).toBe(false);
    expect(canPay(game, "{G}{G}")).toBe(false); // one mana only
  });

  it("enters the battlefield tapped", () => {
    const game = makeGame([]);
    expect(game.state.objects[game.debugSpawn("Frontier Bivouac", A)]?.tapped).toBe(true);
    expect(game.state.objects[game.debugSpawn("Temple of Mystery", A)]?.tapped).toBe(true);
  });

  it("a check land enters untapped only if you already control a matching basic", () => {
    const noBasic = makeGame([]);
    expect(noBasic.state.objects[noBasic.debugSpawn("Rootbound Crag", A)]?.tapped).toBe(true);

    const withForest = makeGame([]);
    withForest.debugSpawn("Forest", A);
    expect(
      withForest.state.objects[withForest.debugSpawn("Rootbound Crag", A)]?.tapped,
    ).toBe(false);

    // an unrelated basic doesn't count
    const withSwamp = makeGame([]);
    withSwamp.debugSpawn("Swamp", A);
    expect(
      withSwamp.state.objects[withSwamp.debugSpawn("Rootbound Crag", A)]?.tapped,
    ).toBe(true);

    // a matching basic an opponent controls doesn't count
    const oppForest = makeGame([]);
    oppForest.debugSpawn("Forest", B);
    expect(
      oppForest.state.objects[oppForest.debugSpawn("Rootbound Crag", A)]?.tapped,
    ).toBe(true);
  });

  it("a fetch land: pay 1 life, sacrifice, put a matching land onto the battlefield", () => {
    const a = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        {
          player: A,
          cards: [
            ...Array(7).fill("Island"),
            "Mountain",
            "Forest",
            ...Array(31).fill("Swamp"),
          ],
        },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(toPrecombat);
    const fetch = game.debugSpawn("Wooded Foothills", A);
    game.state.objects[fetch]!.tapped = false;
    const life0 = game.state.players[A].life;
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);

    game.dispatch({ type: "activate-ability", player: A, source: fetch, abilityIndex: 0 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.result.over);
    // the picker only lists Mountain/Forest — never the 31 Swamps
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind === "choose-from-zone") {
      expect(awaiting.eligible.length).toBeGreaterThan(0);
      // only Mountain/Forest are choosable — never one of the 31 Swamps
      expect(
        awaiting.eligible.every((id) =>
          ["Mountain", "Forest"].includes(game.state.objects[id].cardName),
        ),
      ).toBe(true);
    }

    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.players[A].life).toBe(life0 - 1);
    expect(game.state.objects[fetch]?.zone).toBe("graveyard");
    const fetched = game.battlefield.filter((id) =>
      ["Mountain", "Forest"].includes(game.state.objects[id].cardName),
    );
    expect(fetched.length).toBe(1);
    expect(game.state.objects[fetched[0]!].tapped).toBe(false); // untapped fetch
  });

  it("a pain land: colourless is free, a colour costs 1 life", () => {
    const generic = makeGame(["Bonesplitter"]);
    const kf1 = generic.debugSpawn("Karplusan Forest", A);
    generic.state.objects[kf1]!.tapped = false;
    const life1 = generic.state.players[A].life;
    generic.dispatch({
      type: "cast-spell",
      player: A,
      card: generic.handOf(A).find((id) => generic.state.objects[id].cardName === "Bonesplitter")!,
    });
    generic.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(generic.state.players[A].life).toBe(life1); // {1} paid with {C} — painless

    const coloured = makeGame(["Raging Goblin"]);
    const kf2 = coloured.debugSpawn("Karplusan Forest", A);
    coloured.state.objects[kf2]!.tapped = false;
    const life2 = coloured.state.players[A].life;
    coloured.dispatch({
      type: "cast-spell",
      player: A,
      card: coloured.handOf(A).find((id) => coloured.state.objects[id].cardName === "Raging Goblin")!,
    });
    coloured.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(coloured.state.players[A].life).toBe(life2 - 1); // {R} hurts
  });

  it("the auto-payer uses a basic before a pain land for the same colour", () => {
    const game = makeGame(["Raging Goblin"]);
    const mtn = game.debugSpawn("Mountain", A);
    const kf = game.debugSpawn("Karplusan Forest", A);
    game.state.objects[kf]!.tapped = false;
    const life0 = game.state.players[A].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Raging Goblin")!,
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.players[A].life).toBe(life0); // Mountain tapped, not the painland
    expect(game.state.objects[mtn]?.tapped).toBe(true);
    expect(game.state.objects[kf]?.tapped).toBe(false);
  });

  it("a scry-land's ETB trigger raises a scry decision", () => {
    const game = makeGame([]);
    const id = asObjectId(`hand-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[id] = {
      ...game.state.objects[game.handOf(A)[0]]!,
      id,
      cardName: "Temple of Abandon",
    };
    game.state.zones.perPlayer[A].hand.push(id);
    game.dispatch({ type: "play-land", player: A, card: id });
    game.advanceUntil((s) => s.awaiting !== null || s.result.over);
    expect(game.state.awaiting?.kind).toBe("scry");
  });

  it("a count check land (Cinder Glade) — untapped only with two+ basics", () => {
    const none = makeGame([]);
    expect(none.state.objects[none.debugSpawn("Cinder Glade", A)]?.tapped).toBe(true);

    const two = makeGame([]);
    two.debugSpawn("Forest", A);
    two.debugSpawn("Swamp", A);
    expect(two.state.objects[two.debugSpawn("Cinder Glade", A)]?.tapped).toBe(false);
  });

  it("Rockfall Vale — untapped past two other lands, dealing 1 damage", () => {
    const game = makeGame([]);
    game.debugSpawn("Forest", A);
    game.debugSpawn("Mountain", A);
    const life0 = game.state.players[A].life;
    const id = game.debugSpawn("Rockfall Vale", A);
    expect(game.state.objects[id]?.tapped).toBe(false);
    expect(game.state.players[A].life).toBe(life0 - 1);
  });

  it("a trikeland pays for any of its three colors, 1 life each", () => {
    const game = makeGame([]);
    const id = game.debugSpawn("Riveteers Overlook", A); // {B}/{R}/{G}, Pay 1 life
    game.state.objects[id]!.tapped = false;
    for (const c of ["{B}", "{R}", "{G}"]) expect(canPay(game, c)).toBe(true);
    expect(canPay(game, "{W}")).toBe(false);

    const life0 = game.state.players[A].life;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment = (game as any).payMana(A, parseManaCost("{G}"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (game as any).executePayment(A, payment);
    expect(game.state.players[A].life).toBe(life0 - 1);
  });

  it("a shock land raises a pay-life decision; paying untaps it for 2 life", () => {
    const game = makeGame([]);
    const id = game.debugSpawn("Blood Crypt", A);
    expect(game.state.awaiting).toMatchObject({ kind: "pay-life-for-untapped", source: id, life: 2 });
    expect(game.state.objects[id]?.tapped).toBe(true);

    const life0 = game.state.players[A].life;
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: true });
    expect(game.state.objects[id]?.tapped).toBe(false);
    expect(game.state.players[A].life).toBe(life0 - 2);
    expect(game.state.awaiting).toBeNull();
  });

  it("declining the shock leaves it tapped, no life lost", () => {
    const game = makeGame([]);
    const id = game.debugSpawn("Overgrown Tomb", A);
    const life0 = game.state.players[A].life;
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: false });
    expect(game.state.objects[id]?.tapped).toBe(true);
    expect(game.state.players[A].life).toBe(life0);
  });

  it("no shock decision when the player can't afford the life", () => {
    const game = makeGame([]);
    game.state.players[A].life = 2;
    const id = game.debugSpawn("Stomping Ground", A);
    // life 2 >= 2, so still a decision
    expect(game.state.awaiting?.kind).toBe("pay-life-for-untapped");
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: false });

    game.state.players[A].life = 1;
    const id2 = game.debugSpawn("Blood Crypt", A);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[id2]?.tapped).toBe(true);
    void id;
  });

  it("cycling: pay the cost, discard, draw", () => {
    const game = makeGame([]);
    // give A a land to pay {2} and a Sheltered Thicket in hand
    land(game, "Forest");
    land(game, "Mountain");
    const hand = asObjectId(`hand-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[hand] = {
      ...game.state.objects[game.handOf(A)[0]]!,
      id: hand,
      cardName: "Sheltered Thicket",
    };
    game.state.zones.perPlayer[A].hand.push(hand);

    const cycle = game.legalActions(A).find((a) => a.kind === "cycle");
    expect(cycle).toBeDefined();
    const handSize = game.handOf(A).length;

    game.dispatch({ type: "cycle", player: A, card: hand });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    // -1 (cycled away) +1 (drawn) = same count, minus the cycled card
    expect(game.handOf(A).includes(hand)).toBe(false);
    expect(game.state.objects[hand]?.zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(handSize); // discarded one, drew one
    expect(game.eventsOfType("card-cycled").length).toBe(1);
  });
});
