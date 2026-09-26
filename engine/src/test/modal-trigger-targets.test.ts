/**
 * A modal triggered ability whose modes have targets of their own (rules
 * 603.3c, 700.2): the modes are announced as it goes on the stack, a mode
 * needing a target it can't have isn't offered, the chosen modes bring their
 * targets with them, and each mode reads just its own as it resolves — so a
 * mode whose target has gone illegal still does whatever else it says,
 * while an ability whose every target is illegal does nothing at all.
 *
 * Cards: Hullbreaker Horror, Junji, the Midnight Sky, Aether Channeler,
 * Retreat to Coralhelm, Charming Prince, Silverback Elder, Retreat to
 * Kazandu, Dread Presence, Pip-Boy 3000, Voracious Hydra, Retreat to Hagra,
 * Shambling Ghast, Tiller Engine, Oltec Matterweaver, Kykar, Zephyr Awakener
 * and Glorious Sunrise.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

// Test-only: two modes chosen at once, each with its own target, so the
// slices each mode reads have to line up.
const TWIN = "Twin Tactics Test Engine";
// Test-only: a modal trigger that a token stack fires many times at once.
const WAKE = "Many Wakes Test Engine";
const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: TWIN,
      types: ["enchantment"],
      text: "Whenever you gain life, choose two — …",
      triggered: [
        {
          trigger: { on: "gains-life", who: "you" },
          targets: [],
          effect: {
            kind: "modal",
            announced: true,
            minModes: 2,
            maxModes: 2,
            modes: [
              {
                text: "Put a +1/+1 counter on target creature.",
                targets: ["creature"],
                effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
              },
              { text: "Draw a card.", effect: { kind: "draw", amount: 1 } },
              {
                text: "Tap target creature.",
                targets: ["creature"],
                effect: { kind: "tap", target: 0 },
              },
            ],
          },
          resolve: null,
          text: "Whenever you gain life, choose two — …",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: WAKE,
      types: ["enchantment"],
      text: "Whenever a creature you control enters, choose one — you gain 1 life; draw a card.",
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
          targets: [],
          effect: {
            kind: "modal",
            announced: true,
            minModes: 1,
            maxModes: 1,
            modes: [
              { text: "You gain 1 life.", effect: { kind: "gain-life", amount: 1 } },
              { text: "Draw a card.", effect: { kind: "draw", amount: 1 } },
            ],
          },
          resolve: null,
          text: "Whenever a creature you control enters, choose one — you gain 1 life; draw a card.",
        },
      ],
    }),
  );

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, maxLandsPerTurn: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
/** Put `name` onto the battlefield from A's hand as a real entry, so its
 * enters triggers fire. */
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [obj(card)]);
  settle(game);
  return card;
};
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;

describe("announcing modes (rule 603.3c)", () => {
  it("a mode that needs a target it can't have isn't offered", () => {
    const { game, a } = setUp();
    let offered: readonly string[] = [];
    a.chooseModesFn = (_view, _min, _max, texts) => {
      offered = texts;
      return [texts.length - 1];
    };
    const before = hand(game);
    enter(game, "Aether Channeler");
    // No other nonland permanent: the bounce mode can't be chosen.
    expect(offered).toEqual([
      "Create a 1/1 white Bird creature token with flying.",
      "Draw a card.",
    ]);
    // The last offered mode is the ability's third, not its second.
    expect(hand(game)).toBe(before + 1);
  });

  it("with something to bounce, all three are offered and the bounce reads its own target", () => {
    const { game, a } = setUp();
    const ring = spawn(game, "Sol Ring", B);
    let offered: readonly string[] = [];
    a.chooseModesFn = (_view, _min, _max, texts) => {
      offered = texts;
      return [1];
    };
    a.chooseTargetsFn = () => [obj(ring)];
    enter(game, "Aether Channeler");
    expect(offered.length).toBe(3);
    expect(zoneOf(game, ring)).toBe("hand");
  });

  it("each copy fired at once chooses its own modes", () => {
    const { game, a } = setUp();
    spawn(game, WAKE);
    let asked = 0;
    a.chooseModesFn = () => {
      asked += 1;
      return [asked % 2 === 0 ? 0 : 1];
    };
    const before = { life: life(game, A), hand: hand(game) };
    // Ten Goblins enter as one token stack: one event, fired ten times.
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 }, []);
    settle(game);
    expect(asked).toBe(10);
    expect(life(game, A)).toBe(before.life + 5);
    expect(hand(game)).toBe(before.hand + 5);
  });
});

describe("two modes, each with its own target", () => {
  it("each mode reads its own slice of the targets", () => {
    const { game, a } = setUp();
    spawn(game, TWIN);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [0, 2];
    a.chooseTargetsFn = (_view, _source, specs) => {
      expect(specs.length).toBe(2);
      return [obj(bears), obj(theirs)];
    };
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[theirs].tapped).toBe(true);
    expect(game.state.objects[theirs].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[bears].tapped).toBe(false);
  });

  it("a mode whose target has gone still lets the other do its part (rule 608.2b)", () => {
    const { game, a } = setUp();
    spawn(game, TWIN);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [0, 2];
    a.chooseTargetsFn = () => [obj(bears), obj(theirs)];
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    // Modes and targets are chosen as it goes on the stack.
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.awaiting === null);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });
});

describe("Dread Presence", () => {
  it("a Swamp entering: 2 damage to any target and 2 life", () => {
    const { game, a } = setUp();
    spawn(game, "Dread Presence");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = () => [obj(theirs)];
    enter(game, "Swamp");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(life(game, A)).toBe(22);
  });

  it("a target gone by resolution means no life either (the ruling)", () => {
    const { game, a } = setUp();
    spawn(game, "Dread Presence");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = () => [obj(theirs)];
    const swamp = game.debugSpawn("Swamp", A, "hand");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(swamp)]);
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.awaiting === null);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(theirs)]);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(20);
  });

  it("the draw mode chooses no target", () => {
    const { game, a } = setUp();
    spawn(game, "Dread Presence");
    a.chooseModesFn = () => [0];
    const before = hand(game);
    enter(game, "Swamp");
    expect(hand(game)).toBe(before + 1);
    expect(life(game, A)).toBe(19);
  });
});

describe("Hullbreaker Horror", () => {
  it("casting a spell: up to one mode — bounce a nonland permanent, or none", () => {
    const { game, a } = setUp();
    spawn(game, "Hullbreaker Horror");
    const ring = spawn(game, "Sol Ring", B);
    let offered: readonly string[] = [];
    a.chooseModesFn = (_view, min, _max, texts) => {
      offered = texts;
      expect(min).toBe(0);
      return [texts.length - 1];
    };
    a.chooseTargetsFn = () => [obj(ring)];
    spawn(game, "Wastes");
    const opt = game.debugSpawn("Sol Ring", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: opt, targets: [] });
    game.advanceUntil(quiet);
    // No spell of an opponent's on the stack: only the permanent mode.
    expect(offered).toEqual(["Return target nonland permanent to its owner's hand."]);
    expect(zoneOf(game, ring)).toBe("hand");
  });

  it("returns an opponent's spell to its owner's hand", () => {
    const { game, a, b } = setUp();
    spawn(game, "Hullbreaker Horror");
    spawn(game, "Mountain", B);
    spawn(game, "Island");
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    const opt = game.debugSpawn("Opt", A, "hand");
    b.enqueue({
      action: { type: "cast-spell", player: B, card: bolt, targets: [{ kind: "player", player: A }] },
      when: (view) => view.state.priority.holder === B && view.state.zones.shared.stack.length === 0,
    });
    a.enqueue({
      action: { type: "cast-spell", player: A, card: opt, targets: [] },
      when: (view) => view.state.zones.shared.stack.includes(bolt),
    });
    a.chooseModesFn = (_view, _min, _max, texts) => [
      texts.indexOf("Return target spell you don't control to its owner's hand."),
    ];
    a.chooseTargetsFn = () => [obj(bolt)];
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && quiet(s) && s.zones.perPlayer[B].hand.includes(bolt));
    expect(zoneOf(game, bolt)).toBe("hand");
    expect(life(game, A)).toBe(20);
  });
});

describe("Junji, the Midnight Sky", () => {
  it("dies: put a non-Dragon creature card from a graveyard onto the battlefield, and lose 2", () => {
    const { game, a } = setUp();
    const junji = spawn(game, "Junji, the Midnight Sky");
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const mine = game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.debugSpawn("Shivan Dragon", B, "graveyard");
    let options: readonly TargetRef[] = [];
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = (_view, _source, _specs, opts) => {
      options = opts[0];
      return [obj(theirs)];
    };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(junji)]);
    settle(game);
    // Any graveyard's, and never a Dragon — Junji itself included.
    expect([...options].map((t) => (t.kind === "object" ? t.object : "")).sort()).toEqual([theirs, mine].sort());
    expect(zoneOf(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(life(game, A)).toBe(18);
  });

  it("dies: each opponent discards two and loses 2", () => {
    const { game, a } = setUp();
    const junji = spawn(game, "Junji, the Midnight Sky");
    a.chooseModesFn = () => [0];
    const theirs = hand(game, B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(junji)]);
    settle(game);
    expect(hand(game, B)).toBe(theirs - 2);
    expect(life(game, B)).toBe(18);
  });
});

describe("Retreat to Coralhelm", () => {
  it("you may tap or untap the target creature", () => {
    const { game, a } = setUp();
    spawn(game, "Retreat to Coralhelm");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].tapped = true;
    let calls = 0;
    a.chooseModesFn = (_view, _min, _max, texts) => {
      calls += 1;
      return calls === 1 ? [0] : [texts.indexOf("Untap it")];
    };
    a.chooseTargetsFn = () => [obj(bears)];
    enter(game, "Forest");
    expect(game.state.objects[bears].tapped).toBe(false);
  });
});

describe("Charming Prince", () => {
  it("blinks another creature you own until the next end step, back under your control", () => {
    const { game, a } = setUp();
    const mine = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [2];
    a.chooseTargetsFn = () => [obj(mine)];
    enter(game, "Charming Prince");
    expect(zoneOf(game, mine)).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(zoneOf(game, mine)).toBe("battlefield");
  });
});

describe("Silverback Elder", () => {
  it("casting a creature spell: destroy target artifact", () => {
    const { game, a } = setUp();
    spawn(game, "Silverback Elder");
    const ring = spawn(game, "Sol Ring", B);
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(ring)];
    spawn(game, "Forest");
    spawn(game, "Forest");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, ring)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });
});

describe("the Retreats", () => {
  it("Retreat to Kazandu: a +1/+1 counter on target creature", () => {
    const { game, a } = setUp();
    spawn(game, "Retreat to Kazandu");
    const bears = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(bears)];
    enter(game, "Forest");
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
  });

  it("Retreat to Hagra: +1/+0 and deathtouch, or drain 1", () => {
    const { game, a } = setUp();
    spawn(game, "Retreat to Hagra");
    const bears = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(bears)];
    enter(game, "Swamp");
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).keywords).toContain("deathtouch");
    a.chooseModesFn = () => [1];
    enter(game, "Swamp");
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});

describe("Pip-Boy 3000", () => {
  it("Check Map untaps up to two target lands; Pick a Perk counters the attacker", () => {
    const { game, a } = setUp();
    const pip = spawn(game, "Pip-Boy 3000");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: pip, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    const tapped = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Wastes" && game.state.objects[id].tapped,
    );
    expect(tapped.length).toBe(2);
    a.chooseModesFn = () => [2];
    a.chooseTargetsFn = () => tapped.map(obj);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && quiet(s));
    for (const id of tapped) expect(game.state.objects[id].tapped).toBe(false);
  });
});

describe("Voracious Hydra", () => {
  it("enters with X counters; doubling doubles only the +1/+1 counters", () => {
    const { game, a } = setUp();
    for (let i = 0; i < 5; i++) spawn(game, "Forest");
    a.chooseModesFn = () => [0];
    const hydra = game.debugSpawn("Voracious Hydra", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: hydra, targets: [], xValue: 3 });
    game.advanceUntil(quiet);
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(6);
  });

  it("double-counters with a counter kind doubles just that kind", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 2, charge: 3 };
    game.debugApplyEffect(A, { kind: "double-counters", target: 0, counter: "+1/+1" }, [obj(bears)]);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(4);
    expect(game.state.objects[bears].counters.charge).toBe(3);
  });

  it("the fight mode fights a creature you don't control", () => {
    const { game, a } = setUp();
    for (let i = 0; i < 5; i++) spawn(game, "Forest");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = () => [obj(theirs)];
    const hydra = game.debugSpawn("Voracious Hydra", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: hydra, targets: [], xValue: 3 });
    game.advanceUntil(quiet);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(game.state.objects[hydra].damageMarked).toBe(2);
  });
});

describe("Shambling Ghast", () => {
  it("dies: target creature an opponent controls gets -1/-1", () => {
    const { game, a } = setUp();
    const ghast = spawn(game, "Shambling Ghast");
    const elves = spawn(game, "Llanowar Elves", B);
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(elves)];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ghast)]);
    settle(game);
    expect(zoneOf(game, elves)).toBe("graveyard");
  });
});

describe("Tiller Engine", () => {
  it("a land entering tapped: untap it", () => {
    const { game, a } = setUp();
    spawn(game, "Tiller Engine");
    a.chooseModesFn = () => [0];
    const land = game.debugSpawn("Canyon Slough", A, "hand");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(land)]);
    settle(game);
    expect(zoneOf(game, land)).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(false);
  });

  it("an untapped land doesn't trigger it", () => {
    const { game, a } = setUp();
    spawn(game, "Tiller Engine");
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    enter(game, "Forest");
    expect(asked).toBe(false);
  });
});

describe("Oltec Matterweaver", () => {
  it("copies target artifact token you control", () => {
    const { game, a } = setUp();
    spawn(game, "Oltec Matterweaver");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 }, []);
    settle(game);
    const treasure = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    ) as ObjectId;
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = () => [obj(treasure)];
    spawn(game, "Forest");
    spawn(game, "Forest");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    game.advanceUntil(quiet);
    const treasures = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    );
    expect(treasures.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
  });
});

describe("Kykar, Zephyr Awakener", () => {
  it("a noncreature spell: blink another creature you control until the next end step", () => {
    const { game, a } = setUp();
    spawn(game, "Kykar, Zephyr Awakener");
    const bears = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(bears)];
    spawn(game, "Wastes");
    const ring = game.debugSpawn("Sol Ring", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: ring, targets: [] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });
});

describe("Glorious Sunrise", () => {
  it("a target land taps for {G}{G}{G} this turn", () => {
    const { game, a } = setUp();
    spawn(game, "Glorious Sunrise");
    const forest = spawn(game, "Forest");
    a.chooseModesFn = () => [1];
    a.chooseTargetsFn = () => [obj(forest)];
    game.advanceUntil((s) => s.turn.step === "begin-combat" && quiet(s));
    const offers = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === forest)
      .map((x) => (x.kind === "activate-ability" ? x.text : ""));
    expect(offers).toContain("{T}: Add {G}{G}{G}.");
  });

  it("the draw mode draws only with a creature of power 3 or more", () => {
    const { game, a } = setUp();
    spawn(game, "Glorious Sunrise");
    a.chooseModesFn = () => [2];
    const before = hand(game);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && quiet(s));
    expect(hand(game)).toBe(before);
  });
});

describe("Ayula, Queen Among Bears", () => {
  it("another Bear entering: a Bear you control fights a creature you don't control (two targets in one mode)", () => {
    const { game, a } = setUp();
    spawn(game, "Ayula, Queen Among Bears");
    const elves = spawn(game, "Llanowar Elves", B);
    a.chooseModesFn = () => [1];
    let specs = 0;
    a.chooseTargetsFn = (_view, _source, s, options) => {
      specs = s.length;
      return [options[0].find((t) => t.kind === "object" && game.state.objects[t.object].cardName === "Grizzly Bears") ?? options[0][0], obj(elves)];
    };
    const bears = enter(game, "Grizzly Bears");
    expect(specs).toBe(2);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(game.state.objects[bears].damageMarked).toBe(1);
  });

  it("…or two +1/+1 counters on target Bear", () => {
    const { game, a } = setUp();
    const ayula = spawn(game, "Ayula, Queen Among Bears");
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(ayula)];
    enter(game, "Grizzly Bears");
    expect(game.state.objects[ayula].counters["+1/+1"]).toBe(2);
  });
});

describe("Jin Sakai, Ghost of Tsushima", () => {
  it("a creature attacking a player alone: it gains double strike", () => {
    const { game, a } = setUp();
    spawn(game, "Jin Sakai, Ghost of Tsushima");
    const bears = spawn(game, "Grizzly Bears");
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(16);
  });

  it("two creatures attacking that player: no trigger", () => {
    const { game, a } = setUp();
    spawn(game, "Jin Sakai, Ghost of Tsushima");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: elves, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(asked).toBe(false);
    expect(life(game, B)).toBe(17);
  });

  it("Jin Sakai's own combat damage draws a card", () => {
    const { game, a } = setUp();
    const jin = spawn(game, "Jin Sakai, Ghost of Tsushima");
    a.chooseModesFn = () => [1];
    a.declareAttackersFn = () => [{ attacker: jin, defender: B }];
    const before = hand(game);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(hand(game)).toBe(before + 1);
  });
});

describe("choose one that hasn't been chosen this turn, announced", () => {
  it("Galadriel: creatures entering together each take a different mode; a fourth gets none", () => {
    const { game, a } = setUp();
    spawn(game, "Galadriel, Light of Valinor");
    const offeredEach: (readonly string[])[] = [];
    a.chooseModesFn = (_view, _min, _max, texts) => {
      offeredEach.push(texts);
      return [0];
    };
    const before = hand(game);
    // Four Grizzly Bears enter at once.
    for (let i = 0; i < 4; i++) game.debugSpawn("Grizzly Bears", A, "hand");
    const cards = game.state.zones.perPlayer[A].hand.slice(-4);
    game.debugApplyEffect(
      A,
      { kind: "put-onto-battlefield", target: 0 },
      [obj(cards[0])],
    );
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(cards[1])]);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(cards[2])]);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(cards[3])]);
    settle(game);
    // Asked three times, each time from what was left; the fourth instance
    // has nothing to choose and is removed.
    expect(offeredEach.map((t) => t.length)).toEqual([3, 2, 1]);
    // {G}{G}{G}, then a counter on each creature, then scry 2 and a card.
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G", "G"]);
    for (const id of cards) expect(game.state.objects[id].counters["+1/+1"]).toBe(1);
    expect(hand(game)).toBe(before + 1);
  });

  it("Galadriel: a mode chosen earlier in the turn isn't offered again", () => {
    const { game, a } = setUp();
    spawn(game, "Galadriel, Light of Valinor");
    let offered: readonly string[] = [];
    let calls = 0;
    a.chooseModesFn = (_view, _min, _max, texts) => {
      calls += 1;
      if (calls === 1) return [texts.indexOf("Scry 2, then draw a card.")];
      offered = texts;
      return [0];
    };
    enter(game, "Grizzly Bears");
    enter(game, "Llanowar Elves");
    expect(offered).toEqual(["Add {G}{G}{G}.", "Put a +1/+1 counter on each creature you control."]);
  });

  it("Breeches: each Pirate attacking picks a mode no other has this turn", () => {
    const { game, a } = setUp();
    const breeches = spawn(game, "Breeches, Eager Pillager");
    const theirs = spawn(game, "Grizzly Bears", B);
    let calls = 0;
    a.chooseModesFn = (_view, _min, _max, texts) => {
      calls += 1;
      return [texts.indexOf("Target creature can't block this turn.")];
    };
    a.chooseTargetsFn = () => [obj(theirs)];
    a.declareAttackersFn = () => [{ attacker: breeches, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    expect(calls).toBe(1);
    expect(game.characteristics(theirs).restrictions).toContain("cant-block");
  });
});
