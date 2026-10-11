import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";
import { FACE_DOWN_CARDS } from "../state.js";
import {
  A,
  B,
  activate,
  cast,
  counters,
  enter,
  graveyard,
  hand,
  keywords,
  lands,
  pickFromZone,
  pickModes,
  pt,
  settle,
  spawn,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";

/**
 * Morph, megamorph and disguise (rules 702.37, 702.168): a card cast face
 * down for {3} as a 2/2 creature spell with no name, text, subtypes or mana
 * cost (708.4), seen for what it is only by its controller (708.5); it
 * resolves into a face-down permanent, turned face up for its morph cost as
 * a special action — megamorph with a +1/+1 counter (702.37b), disguise
 * with ward {2} while face down (702.168a). "When this is turned face up"
 * triggers (708.8); manifest dread (701.62a).
 */

const faceDownCast = (game: Game, card: ObjectId, settleIt = true): void =>
  cast(game, card, { via: "face-down", settle: settleIt });

const turnUp = (game: Game, permanent: ObjectId, morph = true): void => {
  game.dispatch({ type: "turn-face-up", player: A, permanent, ...(morph ? { morph: true } : {}) } as Action);
};

describe("casting face down", () => {
  it("offers a morph card face down for {3}, a 2/2 nobody else can name", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    const alchemist = toHand(game, "Aphetto Alchemist");
    const offers = game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === alchemist);
    expect(offers.some((a) => a.kind === "cast-spell" && a.via === "face-down")).toBe(true);
    faceDownCast(game, alchemist, false);
    // On the stack: face down, its name hidden from bob.
    expect(zone(game, alchemist)).toBe("stack");
    expect(game.viewFor(B).objects[alchemist]?.cardName).toBe(FACE_DOWN_CARDS.morph);
    expect(game.viewFor(B).objects[alchemist]?.faceDown?.card).toBeUndefined();
    expect(game.viewFor(A).objects[alchemist]?.faceDown?.card).toBe("Aphetto Alchemist");
    settle(game);
    expect(zone(game, alchemist)).toBe("battlefield");
    expect(game.state.objects[alchemist].faceDown?.kind).toBe("morph");
    expect(pt(game, alchemist)).toEqual({ power: 2, toughness: 2 });
    // No abilities face down (708.2a): its {T} untap isn't there.
    expect(game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === alchemist)).toBe(false);
  });

  it("is a creature spell at sorcery speed, whatever the card is", () => {
    const { game } = table({ step: "begin-combat" });
    lands(game, "Island", 3);
    // Fear of Impostors has flash and no morph; the face-down spell is the
    // 2/2's, and a card without morph isn't offered face down at all.
    const fear = toHand(game, "Fear of Impostors");
    const alchemist = toHand(game, "Aphetto Alchemist");
    expect(game.state.turn.step).toBe("begin-combat");
    const legal = game.legalActions(A);
    expect(legal.some((a) => a.kind === "cast-spell" && a.card === fear && a.via === "face-down")).toBe(false);
    // Fear itself still has flash; the Alchemist, face down or not, waits.
    expect(legal.some((a) => a.kind === "cast-spell" && a.card === fear)).toBe(true);
    expect(legal.some((a) => a.kind === "cast-spell" && a.card === alchemist)).toBe(false);
  });

  it("is turned face up only for its morph cost, and is the card again", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    lands(game, "Island", 1);
    const alchemist = toHand(game, "Aphetto Alchemist");
    faceDownCast(game, alchemist);
    const ups = game.legalActions(A).filter((a) => a.kind === "turn-face-up" && a.permanent === alchemist);
    expect(ups).toHaveLength(1);
    expect(ups[0]).toMatchObject({ cost: "{U}", morph: "morph" });
    expect(() => turnUp(game, alchemist, false)).toThrow();
    turnUp(game, alchemist);
    expect(game.state.objects[alchemist].faceDown).toBeUndefined();
    expect(pt(game, alchemist)).toEqual({ power: 1, toughness: 2 });
    expect(game.viewFor(B).objects[alchemist]?.cardName).toBe("Aphetto Alchemist");
  });

  it("is revealed if it leaves the stack any way but onto the battlefield (708.9)", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    const alchemist = toHand(game, "Aphetto Alchemist");
    faceDownCast(game, alchemist, false);
    game.debugMove(alchemist, "graveyard");
    expect(game.state.objects[alchemist].faceDown).toBeUndefined();
    expect(game.viewFor(B).objects[alchemist]?.cardName).toBe("Aphetto Alchemist");
  });
});

describe("megamorph and disguise", () => {
  it("megamorph puts a +1/+1 counter on it as it's turned face up for that cost", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    lands(game, "Island", 1);
    const lurker = toHand(game, "Gudul Lurker");
    faceDownCast(game, lurker);
    turnUp(game, lurker);
    expect(counters(game, lurker)).toBe(1);
    expect(pt(game, lurker)).toEqual({ power: 2, toughness: 2 });
  });

  it("a manifested megamorph card turned face up for its mana cost gets no counter (the ruling)", () => {
    const { game } = table();
    lands(game, "Island", 1);
    const lurker = spawn(game, "Gudul Lurker");
    game.state.objects[lurker].faceDown = { kind: "manifest" };
    // Both ways are offered for a manifested card with morph (701.40c).
    const ups = game.legalActions(A).filter((a) => a.kind === "turn-face-up" && a.permanent === lurker);
    expect(ups).toHaveLength(2);
    turnUp(game, lurker, false);
    expect(counters(game, lurker)).toBe(0);
  });

  it("a disguised card is a 2/2 with ward {2} face down, and itself face up", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    lands(game, "Swamp", 1);
    lands(game, "Mountain", 1);
    const arno = toHand(game, "Arno Dorian");
    faceDownCast(game, arno);
    expect(game.state.objects[arno].faceDown?.kind).toBe("disguise");
    expect(game.viewFor(B).objects[arno]?.text).toBe("Ward {2}");
    expect(keywords(game, arno).has("deathtouch")).toBe(false);
    turnUp(game, arno);
    expect(pt(game, arno)).toEqual({ power: 3, toughness: 3 });
    expect(keywords(game, arno).has("deathtouch")).toBe(true);
  });
});

describe("turned face up", () => {
  it("Den Protector returns a card from your graveyard as it's turned face up", () => {
    const { game, a } = table();
    lands(game, "Wastes", 3);
    lands(game, "Forest", 2);
    const protector = toHand(game, "Den Protector");
    const bears = toGraveyard(game, "Grizzly Bears");
    toGraveyard(game, "Hill Giant");
    faceDownCast(game, protector);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    turnUp(game, protector);
    settle(game);
    expect(hand(game)).toContain(bears);
    expect(pt(game, protector)).toEqual({ power: 3, toughness: 2 });
  });

  it("Rattleclaw Mystic adds {G}{U}{R} as it's turned face up", () => {
    const { game } = table();
    lands(game, "Wastes", 5);
    const mystic = toHand(game, "Rattleclaw Mystic");
    faceDownCast(game, mystic);
    turnUp(game, mystic);
    settle(game);
    expect(game.state.players[A].manaPool.map((m) => m.type).sort()).toEqual(["G", "R", "U"]);
  });

  it("Hooded Hydra gets five +1/+1 counters as it's turned face up, however it is", () => {
    const { game } = table();
    lands(game, "Wastes", 3);
    lands(game, "Forest", 5);
    const hydra = toHand(game, "Hooded Hydra");
    faceDownCast(game, hydra);
    // Face down it's a 2/2 with no counters — X was never paid.
    expect(counters(game, hydra)).toBe(0);
    turnUp(game, hydra);
    expect(counters(game, hydra)).toBe(5);
    expect(pt(game, hydra)).toEqual({ power: 5, toughness: 5 });
  });

  it("Trail of Mystery gives a creature turned face up +2/+2, and searches as a face-down creature enters", () => {
    const { game, a } = table();
    lands(game, "Wastes", 3);
    lands(game, "Island", 1);
    spawn(game, "Trail of Mystery");
    const forest = toLibrary(game, "Forest");
    const alchemist = toHand(game, "Aphetto Alchemist");
    pickModes(a, 0);
    a.chooseFromZoneFn = () => [forest];
    faceDownCast(game, alchemist);
    expect(hand(game)).toContain(forest);
    turnUp(game, alchemist);
    settle(game);
    expect(pt(game, alchemist)).toEqual({ power: 3, toughness: 4 });
  });
});

describe("Kadena, Slinking Sorcerer", () => {
  it("makes the first face-down creature spell each turn cost {3} less, and draws as one enters", () => {
    const { game } = table();
    spawn(game, "Kadena, Slinking Sorcerer");
    lands(game, "Wastes", 2);
    const first = toHand(game, "Aphetto Alchemist");
    const second = toHand(game, "Gudul Lurker");
    const before = hand(game).length;
    faceDownCast(game, first);
    expect(game.state.objects[first].faceDown?.kind).toBe("morph");
    // The draw, less the card cast.
    expect(hand(game).length).toBe(before - 1 + 1);
    // The second this turn pays the full {3}: two lands aren't enough.
    expect(game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === second && a.via === "face-down")).toBe(false);
  });
});

describe("manifest dread", () => {
  it("Unwanted Remake: the destroyed creature's controller manifests one of their top two, the other to the graveyard", () => {
    const { game, b } = table();
    lands(game, "Plains", 1);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = toLibrary(game, "Hill Giant", B);
    const wurm = toLibrary(game, "Craw Wurm", B);
    let offered: readonly ObjectId[] = [];
    b.chooseFromZoneFn = (_view, cards) => {
      offered = cards;
      return [giant];
    };
    const remake = toHand(game, "Unwanted Remake");
    cast(game, remake, { targets: [{ kind: "object", object: bears }] });
    expect(zone(game, bears)).toBe("graveyard");
    expect([...offered].sort()).toEqual([giant, wurm].sort());
    expect(zone(game, giant)).toBe("battlefield");
    expect(game.state.objects[giant].faceDown?.kind).toBe("manifest");
    expect(game.state.objects[giant].controller).toBe(B);
    expect(graveyard(game, B)).toContain(wurm);
    expect(game.viewFor(A).objects[giant]?.cardName).toBe(FACE_DOWN_CARDS.manifest);
  });

  it("They Came from the Pipes manifests dread twice and draws for each", () => {
    const { game, a } = table();
    for (const name of ["Hill Giant", "Craw Wurm", "Grizzly Bears", "Centaur Courser"]) toLibrary(game, name);
    a.chooseFromZoneFn = (_view, cards) => [cards[0]];
    const before = game.state.zones.perPlayer[A].library.length;
    enter(game, "They Came from the Pipes");
    // Two looks of two (four cards), then a draw per creature manifested.
    expect(game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].faceDown !== undefined)).toHaveLength(2);
    expect(game.state.zones.perPlayer[A].library.length).toBe(before - 6);
  });
});

void pickFromZone;
void activate;
void toStep;
