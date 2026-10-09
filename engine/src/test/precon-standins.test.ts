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
  activate,
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
  loyalty,
  named,
  pickModes,
  pickPermanents,
  pickTargets,
  pt,
  ref,
  spawn,
  subtypes,
  supertypes,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  types,
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

describe("Ob Nixilis Reignited", () => {
  const ultimate = (game: Game): void => {
    const ob = spawn(game, "Ob Nixilis Reignited");
    game.state.objects[ob].counters.loyalty = 8;
    activate(game, ob, 2, { targets: [ref(B)] });
  };
  const draw = (game: Game, player: typeof A): void => {
    game.debugApplyEffect(player, { kind: "draw", amount: 1 });
    settle(game);
  };

  it("−8 gives the target opponent an emblem: every card any player draws costs them 2 life", () => {
    const { game } = table();
    ultimate(game);
    expect(game.state.emblems.map((e) => e.owner)).toEqual([B]);
    draw(game, B);
    expect(life(game, B)).toBe(18);
    // Any player's draw, and never the emblem's "you" but its owner.
    draw(game, A);
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(20);
  });

  it("triggers once per card", () => {
    const { game } = table();
    ultimate(game);
    game.debugApplyEffect(A, { kind: "draw", amount: 3 });
    settle(game);
    expect(life(game, B)).toBe(20 - 6);
  });

  it("+1: you draw a card and lose 1 life", () => {
    const { game } = table();
    const ob = spawn(game, "Ob Nixilis Reignited");
    const before = hand(game).length;
    activate(game, ob, 0);
    expect(hand(game).length).toBe(before + 1);
    expect(life(game, A)).toBe(19);
    expect(counters(game, ob, "loyalty")).toBe(6);
  });
});

describe("Sarkhan, the Dragonspeaker", () => {
  it("+1: a 4/4 Dragon creature and no longer a planeswalker — damage is marked, loyalty untouched", () => {
    const { game } = table();
    const sarkhan = spawn(game, "Sarkhan, the Dragonspeaker");
    loyalty(game, sarkhan, 1);
    expect(types(game, sarkhan)).toEqual(["creature"]);
    expect(subtypes(game, sarkhan)).toEqual(["Dragon"]);
    expect(supertypes(game, sarkhan)).toContain("legendary");
    expect(pt(game, sarkhan)).toEqual({ power: 4, toughness: 4 });
    expect([...keywords(game, sarkhan)].sort()).toEqual(["flying", "haste", "indestructible"]);
    game.debugApplyEffect(B, { kind: "damage", amount: 3, target: 0 }, [ref(sarkhan)]);
    settle(game);
    expect(counters(game, sarkhan, "loyalty")).toBe(5);
    expect(game.state.objects[sarkhan].damageMarked).toBe(3);
    toStep(game, "upkeep", B);
    expect(types(game, sarkhan)).toEqual(["planeswalker"]);
    expect(counters(game, sarkhan, "loyalty")).toBe(5);
  });

  it("−6: two more cards each draw step, and the hand discarded at each end step", () => {
    const { game } = table();
    const sarkhan = spawn(game, "Sarkhan, the Dragonspeaker");
    loyalty(game, sarkhan, -6, { atLeast: 6 });
    toStep(game, "end");
    settle(game);
    expect(hand(game).length).toBe(0);
    toStep(game, "precombat-main");
    // The draw step's own card and the emblem's two.
    expect(hand(game).length).toBe(3);
  });
});

describe("a planeswalker that's also a creature (rule 120.3)", () => {
  it("loses loyalty and is marked with the damage", () => {
    const { game } = table();
    const ob = spawn(game, "Ob Nixilis Reignited");
    game.debugApplyEffect(
      A,
      { kind: "animate", target: 0, power: 6, toughness: 6, addTypes: ["creature"], addSubtypes: [], duration: "end-of-turn" },
      [ref(ob)],
    );
    game.debugApplyEffect(B, { kind: "damage", amount: 2, target: 0 }, [ref(ob)]);
    settle(game);
    expect(counters(game, ob, "loyalty")).toBe(3);
    expect(game.state.objects[ob].damageMarked).toBe(2);
  });
});

describe("prevent-damage amount: \"all\"", () => {
  it("prevents every hit to its target this turn and isn't used up", () => {
    const { game } = table();
    const wurm = spawn(game, "Craw Wurm");
    game.debugApplyEffect(A, { kind: "prevent-damage", target: 0, amount: "all" }, [ref(wurm)]);
    for (const n of [3, 5]) game.debugApplyEffect(B, { kind: "damage", amount: n, target: 0 }, [ref(wurm)]);
    settle(game);
    expect(game.state.objects[wurm].damageMarked).toBe(0);
    expect(zone(game, wurm)).toBe("battlefield");
  });
});

describe("Liliana, Untouched by Death", () => {
  it("−3: Zombie spells castable from your graveyard this turn — one put there afterwards too, and not other cards", () => {
    const { game } = table();
    const liliana = spawn(game, "Liliana, Untouched by Death");
    lands(game, "Swamp", 4);
    const bears = toGraveyard(game, "Grizzly Bears");
    loyalty(game, liliana, -3);
    // Put there after the ability resolved, still castable (its ruling).
    const zombie = toGraveyard(game, "Diregraf Ghoul");
    const offered = (id: string): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === id);
    expect(offered(zombie)).toBe(true);
    expect(offered(bears)).toBe(false);
    cast(game, zombie, { via: "graveyard-permission" });
    expect(zone(game, zombie)).toBe("battlefield");
    // The permission ends with the turn.
    const later = toGraveyard(game, "Diregraf Ghoul");
    toStep(game, "precombat-main", B);
    toStep(game, "precombat-main");
    expect(offered(later)).toBe(false);
  });

  it("+1: drains only if a Zombie card was milled", () => {
    const { game } = table();
    const liliana = spawn(game, "Liliana, Untouched by Death");
    toLibrary(game, "Diregraf Ghoul");
    loyalty(game, liliana, 1);
    expect([life(game, A), life(game, B)]).toEqual([22, 18]);
    const second = table();
    const other = spawn(second.game, "Liliana, Untouched by Death");
    loyalty(second.game, other, 1);
    expect([life(second.game, A), life(second.game, B)]).toEqual([20, 20]);
  });

  it("−2: -X/-X where X is your Zombies", () => {
    const { game } = table();
    const liliana = spawn(game, "Liliana, Untouched by Death");
    lands(game, "Diregraf Ghoul", 2);
    const wurm = spawn(game, "Craw Wurm", B);
    loyalty(game, liliana, -2, { targets: [ref(wurm)] });
    expect(pt(game, wurm)).toEqual({ power: 4, toughness: 2 });
  });
});
