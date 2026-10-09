import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { FACE_DOWN_CARDS, publicNameAt } from "../state.js";

/**
 * Face-down permanents (rule 708): manifest (701.40) and cloak (701.58). A
 * face-down permanent is a 2/2 creature with no name, text, subtypes or mana
 * cost (708.2a) — ward {2} too, if cloaked — that only its controller may
 * look at (708.5). It was turned face down before it entered, so its own
 * enters abilities never happen (708.3); it's turned face up as a special
 * action for its mana cost if it's a creature card (701.40b), without
 * entering again (708.8); and it's revealed as it leaves (708.9).
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" | "graveyard" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

/** Put a fresh `name` on top of `player`'s library. */
function onTop(game: Game, player: PlayerId, name: string): ObjectId {
  const id = game.debugSpawn(name, player, "library");
  const library = game.state.zones.perPlayer[player].library;
  library.splice(library.indexOf(id), 1);
  library.unshift(id);
  return id;
}

/** Pass priority until the stack is empty; stop at (and return) any decision. */
function settle(game: Game): void {
  for (let i = 0; i < 50; i += 1) {
    if (game.state.awaiting !== null) throw new Error(`unexpected decision ${game.state.awaiting.kind}`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

/** Alice casts Reality Shift on `target`. */
function realityShift(game: Game, target: ObjectId): void {
  spawn(game, "Island", A);
  spawn(game, "Island", A);
  const shift = spawn(game, "Reality Shift", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: shift, targets: [{ kind: "object", object: target }] });
  settle(game);
}

describe("face-down permanents (rule 708)", () => {
  it("Reality Shift: its controller manifests a face-down 2/2 whose own enters ability doesn't trigger", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const visionary = onTop(game, B, "Elvish Visionary");
    const hand = game.handOf(B).length;
    realityShift(game, bears);

    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[visionary]).toMatchObject({ zone: "battlefield", controller: B, faceDown: { kind: "manifest" } });
    const c = game.characteristics(visionary);
    expect(c).toMatchObject({ power: 2, toughness: 2, types: ["creature"], subtypes: [] });
    expect(c.colors.size).toBe(0);
    // "When this creature enters, draw a card" — not as a face-down 2/2.
    expect(game.handOf(B).length).toBe(hand);
    expect(game.state.eventLog.some((e) => e.type === "card-manifested" && e.object === visionary)).toBe(true);
  });

  it("shows only its controller which card it is", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const visionary = onTop(game, B, "Elvish Visionary");
    realityShift(game, bears);

    const theirs = game.viewFor(B).objects[visionary];
    const ours = game.viewFor(A).objects[visionary];
    expect(theirs?.faceDown).toEqual({ kind: "manifest", card: "Elvish Visionary" });
    expect(ours?.faceDown).toEqual({ kind: "manifest" });
    for (const view of [ours, theirs]) {
      expect(view).toMatchObject({ cardName: FACE_DOWN_CARDS.manifest, art: null, manaCost: null, text: "", power: 2 });
    }
    // The log never names it either.
    expect(publicNameAt(game.state.publicStints ?? {}, visionary, game.state.eventSeq)).toBe(FACE_DOWN_CARDS.manifest);
  });

  it("is turned face up for its mana cost, without entering again", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const visionary = onTop(game, B, "Elvish Visionary");
    realityShift(game, bears);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === B);
    spawn(game, "Forest", B);
    spawn(game, "Forest", B);
    const offer = game.legalActions(B).find((a) => a.kind === "turn-face-up");
    expect(offer).toEqual({ kind: "turn-face-up", permanent: visionary, cardName: "Elvish Visionary", cost: "{1}{G}" });
    expect(game.legalActions(A).some((a) => a.kind === "turn-face-up")).toBe(false);
    const hand = game.handOf(B).length;
    const before = game.state.eventSeq;

    game.dispatch({ type: "turn-face-up", player: B, permanent: visionary });
    expect(game.state.objects[visionary].faceDown).toBeUndefined();
    expect(game.characteristics(visionary)).toMatchObject({ power: 1, toughness: 1, subtypes: ["Elf", "Shaman"] });
    // Rule 708.8: it was already on the battlefield, so no card is drawn.
    settle(game);
    expect(game.handOf(B).length).toBe(hand);
    expect(game.viewFor(A).objects[visionary]?.cardName).toBe("Elvish Visionary");
    // Before, the log knew it as a face-down 2/2; from now on by its name.
    expect(publicNameAt(game.state.publicStints ?? {}, visionary, before - 1)).toBe(FACE_DOWN_CARDS.manifest);
    expect(publicNameAt(game.state.publicStints ?? {}, visionary, game.state.eventSeq)).toBe("Elvish Visionary");
  });

  it("can't turn a noncreature card face up", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    onTop(game, B, "Forest");
    realityShift(game, bears);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(game.legalActions(B).some((a) => a.kind === "turn-face-up")).toBe(false);
  });

  it("is revealed as it leaves the battlefield (708.9)", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const visionary = onTop(game, B, "Elvish Visionary");
    realityShift(game, bears);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: visionary }]);
    settle(game);

    expect(game.state.objects[visionary]).toMatchObject({ zone: "graveyard" });
    expect(game.state.objects[visionary].faceDown).toBeUndefined();
    const reveal = game.state.eventLog.find((e) => e.type === "cards-revealed" && e.objects.includes(visionary));
    expect(reveal).toMatchObject({ from: "battlefield", player: B });
    // It died as a face-down 2/2 (its last-known information) and is known by
    // name in the graveyard.
    expect(game.state.objects[visionary].lastKnown?.name).toBe(FACE_DOWN_CARDS.manifest);
    expect(publicNameAt(game.state.publicStints ?? {}, visionary, game.state.eventSeq)).toBe("Elvish Visionary");
  });

  it("cloaked, it has ward {2}", () => {
    const game = table();
    const angel = onTop(game, A, "Serra Angel");
    game.debugApplyEffect(A, { kind: "manifest", who: "you", cloak: true });
    expect(game.state.objects[angel].faceDown).toEqual({ kind: "cloak" });
    expect(game.characteristics(angel).keywords.size).toBe(0);
    expect(game.viewFor(B).objects[angel]?.text).toBe("Ward {2}");
    // Bob targets it: ward triggers.
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", B);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === B);
    const bolt = spawn(game, "Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: angel }] });
    expect(game.state.pendingTriggers.length + game.state.zones.shared.stack.length).toBeGreaterThan(1);
  });

  it("a Clone copying it copies the face-down 2/2 (rule 708.2: those are its copiable values)", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const visionary = onTop(game, B, "Elvish Visionary");
    realityShift(game, bears);
    for (let i = 0; i < 4; i += 1) spawn(game, "Island", A);
    const clone = spawn(game, "Clone", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: clone, targets: [] });
    for (let i = 0; i < 10 && game.state.awaiting === null; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    }
    expect(game.state.awaiting?.kind).toBe("choose-copy");
    game.dispatch({ type: "choose-copy", player: A, copy: visionary });
    settle(game);
    expect(game.state.objects[clone].copyOf).toBe(FACE_DOWN_CARDS.manifest);
    expect(game.characteristics(clone)).toMatchObject({ power: 2, toughness: 2, subtypes: [] });
  });
});
