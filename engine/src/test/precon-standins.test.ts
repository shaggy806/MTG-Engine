/**
 * The nine starter precons' stand-ins (`SAMPLE_DECKS`' substitution tables),
 * authored one by one from 2026-10-09 — each card's own behaviour, and the
 * engine piece it needed where it needed one. Written on the shared table in
 * `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";

import {
  A,
  B,
  attack,
  blockOffer,
  cast,
  counters,
  destroy,
  enter,
  grant,
  keywords,
  lands,
  life,
  named,
  pickModes,
  pickPermanents,
  pickTargets,
  pt,
  ref,
  spawn,
  supertypes,
  table,
  toHand,
  toStep,
  tokensNamed,
  watchTargets,
  zone,
  hand,
  settle,
} from "./harness.js";

describe("Carnelian Orb of Dragonkind", () => {
  it("gives a Dragon creature spell its mana pays for haste, until end of turn", () => {
    const { game } = table();
    spawn(game, "Carnelian Orb of Dragonkind");
    lands(game, "Wastes", 2);
    const whelp = toHand(game, "Firespitter Whelp");
    // The Orb is the only red source, so the auto-payer spends its mana.
    cast(game, whelp);
    expect(zone(game, whelp)).toBe("battlefield");
    expect(keywords(game, whelp).has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(keywords(game, whelp).has("haste")).toBe(false);
  });

  it("gives nothing to a spell that isn't a Dragon creature", () => {
    const { game } = table();
    spawn(game, "Carnelian Orb of Dragonkind");
    lands(game, "Wastes", 1);
    const goblin = toHand(game, "Goblin Piker");
    cast(game, goblin);
    expect(zone(game, goblin)).toBe("battlefield");
    expect(keywords(game, goblin).has("haste")).toBe(false);
  });
});

describe("Rowdy Research", () => {
  it("costs {1} less for each creature that attacked this turn, one that's gone included", () => {
    const { game, a } = table();
    const bears = lands(game, "Grizzly Bears", 3);
    attack(game, a, bears);
    // One of them dies after attacking: it still attacked this turn.
    destroy(game, bears[0]);
    lands(game, "Island", 4);
    const research = toHand(game, "Rowdy Research");
    const before = hand(game).length;
    cast(game, research);
    expect(zone(game, research)).toBe("graveyard");
    expect(hand(game).length).toBe(before - 1 + 3);
  });

  it("costs its full {6}{U} with nothing attacking", () => {
    const { game } = table();
    lands(game, "Island", 4);
    const research = toHand(game, "Rowdy Research");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === research)).toBe(false);
  });
});

describe("Tetsuko Umezawa, Fugitive", () => {
  it("makes creatures you control with power or toughness 1 or less unblockable", () => {
    const { game, a } = table();
    const tetsuko = spawn(game, "Tetsuko Umezawa, Fugitive"); // 1/3
    const piker = spawn(game, "Goblin Piker"); // 2/1
    const bears = spawn(game, "Grizzly Bears"); // 2/2
    const giant = spawn(game, "Hill Giant", B);
    const offer = blockOffer(game, a, [tetsuko, piker, bears]);
    expect(offer.eligible.find((e) => e.blocker === giant)?.canBlock).toEqual([bears]);
  });
});

describe("Challenger Troll", () => {
  it("lets each creature you control with power 4 or greater be blocked by one creature at most", () => {
    const { game, a } = table();
    const troll = spawn(game, "Challenger Troll");
    const bears = spawn(game, "Grizzly Bears");
    const [b1, b2, b3] = [spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B)];
    const offer = blockOffer(game, a, [troll, bears]);
    expect(offer.singleBlockerAttackers).toEqual([troll]);
    expect(() =>
      game.dispatch({
        type: "declare-blockers",
        player: B,
        blocks: [
          { blocker: b1, attacker: troll },
          { blocker: b2, attacker: troll },
        ],
      }),
    ).toThrow(/can't be blocked by more than one creature/);
    // One on the Troll, and two on the Bears (power 2): legal.
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: [
        { blocker: b1, attacker: troll },
        { blocker: b2, attacker: bears },
        { blocker: b3, attacker: bears },
      ],
    });
    expect(game.state.objects[troll].blockedBy).toEqual([b1]);
  });

  it("reads power as blocks are declared: a pumped creature is covered", () => {
    const { game, a } = table();
    spawn(game, "Challenger Troll");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    spawn(game, "Hill Giant", B);
    expect(blockOffer(game, a, [bears]).singleBlockerAttackers).toEqual([bears]);
  });
});

describe("Skyclave Apparition", () => {
  const ILLUSION = "Illusion Token (Skyclave Apparition)";

  it("exiles a small permanent, and when it leaves the card's owner gets an X/X Illusion", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears", B);
    pickTargets(a, bears);
    const skyclave = enter(game, "Skyclave Apparition");
    expect(zone(game, bears)).toBe("exile");
    destroy(game, skyclave);
    const [token] = named(game, ILLUSION, B);
    expect(token).toBeDefined();
    expect(pt(game, token)).toEqual({ power: 2, toughness: 2 });
    // The card stays exiled.
    expect(zone(game, bears)).toBe("exile");
  });

  it("creates no token when it exiled nothing", () => {
    const { game } = table();
    const skyclave = enter(game, "Skyclave Apparition");
    destroy(game, skyclave);
    expect(tokensNamed(game, ILLUSION)).toBe(0);
  });

  it("can't exile a permanent with mana value over 4", () => {
    const { game, a } = table();
    const angel = spawn(game, "Serra Angel", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const seen = watchTargets(a);
    enter(game, "Skyclave Apparition");
    expect(seen.asked).toBe(1);
    expect(seen.offered[0]).toContain(bears);
    expect(seen.offered[0]).not.toContain(angel);
    expect(zone(game, angel)).toBe("battlefield");
  });
});

describe("Ram Through", () => {
  const ram = (game: Game, mine: ObjectId, theirs: ObjectId): void => {
    lands(game, "Forest", 2);
    cast(game, toHand(game, "Ram Through"), { targets: [ref(mine), ref(theirs)] });
  };

  it("with trample, deals the excess to the creature's controller", () => {
    const { game } = table();
    const wurm = spawn(game, "Craw Wurm"); // 6/4
    grant(game, wurm, "trample");
    const bears = spawn(game, "Grizzly Bears", B); // 2/2
    ram(game, wurm, bears);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(20 - 4);
  });

  it("without trample, all of it goes to the creature", () => {
    const { game } = table();
    const wurm = spawn(game, "Craw Wurm");
    const bears = spawn(game, "Grizzly Bears", B);
    ram(game, wurm, bears);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(20);
  });

  it("counts damage already marked toward lethal", () => {
    const { game } = table();
    const wurm = spawn(game, "Craw Wurm");
    grant(game, wurm, "trample");
    const giant = spawn(game, "Hill Giant", B); // 3/3
    game.state.objects[giant].damageMarked = 2;
    ram(game, wurm, giant);
    expect(life(game, B)).toBe(20 - 5);
  });
});

describe("Foe-Razer Regent", () => {
  it("may fight as it enters, then gets two +1/+1 counters at the next end step", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears", B);
    pickTargets(a, bears);
    pickModes(a, 0);
    const regent = enter(game, "Foe-Razer Regent");
    expect(zone(game, bears)).toBe("graveyard");
    expect(counters(game, regent)).toBe(0);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(counters(game, regent)).toBe(2);
  });

  it("counts any creature you control fighting — each of two of yours", () => {
    const { game } = table();
    spawn(game, "Foe-Razer Regent");
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "fight", a: 0, b: 1 }, [
      { kind: "object", object: giant },
      { kind: "object", object: bears },
    ]);
    settle(game);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(counters(game, giant)).toBe(2);
    // The Bears died in the fight: nothing to put counters on.
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("isn't a fight when the other creature is gone, so nothing triggers", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears", B);
    pickTargets(a, bears);
    pickModes(a, 0);
    const regent = enter(game, "Foe-Razer Regent", A, { settle: false });
    // The target leaves before the enters ability resolves.
    expect(game.state.pendingTriggers.length + game.state.zones.shared.stack.length).toBeGreaterThan(0);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    expect(zone(game, bears)).toBe("graveyard");
    settle(game);
    expect(game.eventsOfType("creature-fought")).toEqual([]);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(counters(game, regent)).toBe(0);
  });
});

describe("Helm of the Host", () => {
  const helmOn = (game: Game, creature: ObjectId): ObjectId => {
    const helm = spawn(game, "Helm of the Host");
    game.state.objects[helm].attachedTo = creature;
    return helm;
  };

  it("makes a nonlegendary, hasty token copy of the equipped creature each combat", () => {
    const { game } = table();
    const commander = spawn(game, "Tetsuko Umezawa, Fugitive");
    helmOn(game, commander);
    toStep(game, "begin-combat");
    settle(game);
    const [token] = named(game, "Tetsuko Umezawa, Fugitive").filter((id) => game.state.objects[id].isToken);
    expect(token).toBeDefined();
    expect(supertypes(game, token)).not.toContain("legendary");
    expect(keywords(game, token).has("haste")).toBe(true);
    // The legend rule didn't apply: both are still here.
    expect(zone(game, commander)).toBe("battlefield");
  });

  it("makes nothing when it equips nothing", () => {
    const { game } = table();
    spawn(game, "Helm of the Host");
    spawn(game, "Grizzly Bears");
    toStep(game, "begin-combat");
    settle(game);
    expect(game.battlefield.some((id) => game.state.objects[id].isToken)).toBe(false);
  });
});

describe("God-Eternal Bontu", () => {
  it("sacrifices the other permanents chosen, at once, and draws that many", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    const piker = spawn(game, "Goblin Piker");
    const keep = spawn(game, "Wastes");
    const choice = pickPermanents(a, bears, piker);
    const before = hand(game).length;
    const bontu = enter(game, "God-Eternal Bontu");
    // Never Bontu itself: "other permanents".
    expect(choice.offered).not.toContain(bontu);
    expect(choice.offered).toContain(keep);
    expect([zone(game, bears), zone(game, piker), zone(game, keep)]).toEqual(["graveyard", "graveyard", "battlefield"]);
    expect(hand(game).length).toBe(before + 2);
  });

  it("may sacrifice nothing, and then draws nothing", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    pickPermanents(a);
    const before = hand(game).length;
    enter(game, "God-Eternal Bontu");
    expect(zone(game, bears)).toBe("battlefield");
    expect(hand(game).length).toBe(before);
  });
});
