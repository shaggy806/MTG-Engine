/**
 * Which side of the table a target belongs on (`target-polarity.ts`) — read
 * off real cards, since what matters is that the effect vocabulary says the
 * right thing about the cards people actually play.
 */

import { describe, expect, it } from "vitest";

import { POOL_CARDS, createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import {
  abilityPolarities,
  castPolarities,
  onlyWrongSide,
  pendingTargetPolarities,
  rankTargets,
  specSide,
} from "../target-polarity.js";

const registry = createDefaultRegistry();
const cast = (name: string) => castPolarities(registry.get(name));
const activated = (name: string, index: number) =>
  abilityPolarities(registry.get(name).activated[index]);
const triggered = (name: string, index: number) =>
  abilityPolarities(registry.get(name).triggered[index]);

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

describe("slot polarity", () => {
  it("aims removal, theft and punishment at an opponent", () => {
    for (const name of [
      "Murder",
      "Doom Blade",
      "Lightning Bolt",
      "Negate",
      "Counterspell",
      "Act of Treason",
      "Diabolic Edict",
      "Blightning",
      "Turn to Frog",
      "Unlicensed Disintegration",
    ]) {
      expect(cast(name), name).toEqual(["harm"]);
    }
  });

  it("reads a -X/-X written as a negative product as removal, not a pump", () => {
    // `{ product: ["x", -1] }`: the sign is the factor's, not a live count's.
    expect(cast("Defile")).toEqual(["harm"]);
    expect(activated("Necropolis Fiend", 0)).toEqual(["harm"]);
    expect(activated("Grim Hireling", 0)).toEqual(["harm"]);
  });

  it("lets removal decide over the consolation it gives its victim", () => {
    // Life for the exiled creature's controller, a land to search for, a
    // 3/3 to make up for the destroyed permanent: all still removal.
    for (const name of [
      "Swords to Plowshares",
      "Path to Exile",
      "Generous Gift",
      "Beast Within",
      "Condemn",
      "Arcane Denial",
    ]) {
      expect(cast(name), name).toEqual(["harm"]);
    }
  });

  it("aims pumps, card draw and recursion at its own side", () => {
    for (const name of ["Giant Growth", "Deep Analysis", "Regrowth", "Cloudshift"]) {
      expect(cast(name), name).toEqual(["help"]);
    }
    // Two cards outrank two life: Sign in Blood is card draw, not a burn spell.
    expect(cast("Sign in Blood")).toEqual(["help"]);
  });

  it("reads an Aura's statics for the permanent it enchants", () => {
    expect(cast("Pacifism")).toEqual(["harm"]);
    expect(cast("Mind Control")).toEqual(["harm"]);
    expect(cast("Rancor")).toEqual(["help"]);
    expect(cast("Lure")).toEqual(["help"]);
  });

  it("reads activated and triggered abilities", () => {
    expect(activated("Garruk Wildspeaker", 0)).toEqual(["help", "help"]);
    expect(activated("Ajani, Caller of the Pride", 0)).toEqual(["help"]);
    expect(triggered("Drakuseth, Maw of Flames", 0)).toEqual(["harm", "harm", "harm"]);
    expect(triggered("Kaervek the Merciless", 0)).toEqual(["harm"]);
    expect(triggered("Rishkar, Peema Renegade", 0)).toEqual(["help", "help"]);
    expect(triggered("Snapcaster Mage", 0)).toEqual(["help"]);
  });

  it("splits a fight between the fighter and its victim", () => {
    expect(cast("Prey Upon")).toEqual(["help", "harm"]);
    expect(cast("Rabid Bite")).toEqual(["help", "harm"]);
  });

  it("takes the best of anyone's when what comes of it is yours", () => {
    expect(cast("Reanimate")).toEqual(["take"]);
    expect(cast("Twincast")).toEqual(["take"]);
    expect(cast("Hate Mirage")).toEqual(["take", "take"]);
  });

  it("classifies nearly every targeted slot in the pool", () => {
    // A ratchet, not a target: 98.6% when this was written (1,771 slots).
    // What's left is genuinely the board's call — a transform, an animated
    // land, a suspect — and a drop means new cards are reaching for effects
    // the table doesn't know which way to point.
    let slots = 0;
    let decided = 0;
    for (const def of POOL_CARDS) {
      const all = [
        ...(def.targets.length > 0 && def.castModal === null ? castPolarities(def) : []),
        ...def.activated.flatMap((a) => (a.targets.length > 0 ? abilityPolarities(a) : [])),
        ...def.triggered.flatMap((t) => (t.targets.length > 0 ? abilityPolarities(t) : [])),
      ];
      slots += all.length;
      decided += all.filter((p) => p !== "either").length;
    }
    expect(slots).toBeGreaterThan(1500);
    expect(decided / slots).toBeGreaterThan(0.97);
  });
});

describe("spec side", () => {
  it("says when the card has already chosen the side", () => {
    expect(specSide("creature")).toBe("any");
    expect(specSide("any-target")).toBe("any");
    expect(specSide("creature-you-control")).toBe("you");
    expect(specSide("opponent")).toBe("opponent");
    expect(specSide({ kind: "optional", of: "creature-an-opponent-controls" })).toBe("opponent");
    expect(specSide({ kind: "permanent", whose: "you", filter: { type: "creature" } })).toBe("you");
    expect(specSide({ kind: "card-in-graveyard" })).toBe("any");
  });
});

describe("ranking targets", () => {
  // Four players, and — as `legalTargets` lists them — the oldest permanents
  // first: our own Grizzly Bears before carol's Craw Wurm.
  const board = () => {
    const game = Game.create({
      seed: 3,
      registry,
      decks: [A, B, C, D].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const elves = game.debugSpawn("Llanowar Elves", B, "battlefield", { summoningSick: false });
    const wurm = game.debugSpawn("Craw Wurm", C, "battlefield", { summoningSick: false });
    const baloth = game.debugSpawn("Rumbling Baloth", A, "battlefield", { summoningSick: false });
    const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
    return { game, bears: obj(bears), elves: obj(elves), wurm: obj(wurm), baloth: obj(baloth) };
  };

  it("puts the opponents' biggest threat first for harm, and our least valuable last-but-least-bad", () => {
    const { game, bears, elves, wurm, baloth } = board();
    const ranked = rankTargets(game.state, registry, A, [bears, elves, wurm, baloth], "harm");
    expect(ranked).toEqual([wurm, elves, bears, baloth]);
  });

  it("puts our own best first for help", () => {
    const { game, bears, elves, wurm, baloth } = board();
    const ranked = rankTargets(game.state, registry, A, [bears, elves, wurm, baloth], "help");
    expect(ranked).toEqual([baloth, bears, elves, wurm]);
  });

  it("takes the best of anyone's, and leaves 'either' in the order offered", () => {
    const { game, bears, elves, wurm, baloth } = board();
    expect(rankTargets(game.state, registry, A, [bears, elves, wurm, baloth], "take")[0]).toEqual(wurm);
    expect(rankTargets(game.state, registry, A, [bears, elves, wurm, baloth], "either")).toEqual([
      bears,
      elves,
      wurm,
      baloth,
    ]);
  });

  it("knows when every legal target is on the wrong side — unless the card chose the side", () => {
    const { game, bears, baloth, wurm } = board();
    expect(onlyWrongSide(game.state, A, [bears, baloth], "harm", "creature")).toBe(true);
    expect(onlyWrongSide(game.state, A, [bears, baloth, wurm], "harm", "creature")).toBe(false);
    // "Destroy target creature you control" means it.
    expect(onlyWrongSide(game.state, A, [bears, baloth], "harm", "creature-you-control")).toBe(false);
    expect(onlyWrongSide(game.state, A, [wurm], "help", "creature")).toBe(true);
  });
});

describe("a pending trigger's slots", () => {
  it("reads the polarity of the triggered ability being put on the stack", () => {
    const game = Game.create({
      seed: 3,
      registry,
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Sol Ring", A, "battlefield");
    game.debugSpawn("Arcane Signet", B, "battlefield");
    const sage = game.debugSpawn("Reclamation Sage", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: sage, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    expect(pendingTargetPolarities(game.state, registry)).toEqual(["harm"]);
  });
});
