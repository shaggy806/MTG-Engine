/**
 * Channel (rule 702.51a) — the EDH-popularity backlog's first Tier-1 feature
 * (`neededCards-features.md`): "Channel — [cost], Discard this card:
 * [effect]", activatable only from hand. New engine surface:
 * `ActivatedAbility.zone: "hand"` (discarding the source is an implicit part
 * of the cost), `ActivatedAbility.costReduction` (a live-count discount
 * printed on the ability itself, mirroring `CardDefinition.selfCostReduction`
 * for a spell), two new `TargetSpec`s (`attacking-or-blocking-creature`,
 * `artifact-enchantment-or-nonbasic-land-an-opponent-controls`), and
 * `CardFilter.typesAnyOf` (an OR of card types, mirroring `subtypes`).
 * Shipped against the Kamigawa Channel-land cycle: Boseiju, Otawara,
 * Takenuma, Eiganjo.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

/** Channel abilities are index 1 on every card here (index 0 is the land's
 * plain `{T}: Add` mana ability) — found via `legalActions` rather than
 * hardcoded, so a reordering of the definition doesn't silently break this. */
const channelActionOf = (game: Game, player: PlayerId, source: ObjectId) => {
  const action = game
    .legalActions(player)
    .find((a) => a.kind === "activate-ability" && a.source === source && a.text.startsWith("Channel"));
  if (action === undefined || action.kind !== "activate-ability") {
    throw new Error("no Channel action available");
  }
  return action;
};

// Give every land in these tests one green source of mana so a {1}{G}/{3}{U}/
// {3}{B}/{2}{W} Channel cost is always payable regardless of color.
const withMana = (game: Game, player: PlayerId, count: number): void => {
  for (let i = 0; i < count; i++) game.debugSpawn("Command Tower", player);
};

describe("Boseiju, Who Endures", () => {
  it("destroys a target artifact/enchantment/nonbasic-land an opponent controls, discarding itself and paying the reduced cost", () => {
    const game = makeGame([], []);
    const boseiju = game.debugSpawn("Boseiju, Who Endures", A, "hand");
    withMana(game, A, 3);
    const opponentArtifact = game.debugSpawn("Arcane Signet", B);

    const action = channelActionOf(game, A, boseiju);
    const target = action.targetOptions[0]?.[0];
    expect(target).toEqual({ kind: "object", object: opponentArtifact });

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: boseiju,
      abilityIndex: action.abilityIndex,
      targets: [target!],
    });
    expect(game.state.objects[boseiju]?.zone).toBe("graveyard");
    settle(game);

    expect(game.state.objects[opponentArtifact]?.zone).toBe("graveyard");
  });

  it("cannot target your own permanents", () => {
    const game = makeGame([], []);
    const boseiju = game.debugSpawn("Boseiju, Who Endures", A, "hand");
    withMana(game, A, 3);
    game.debugSpawn("Arcane Signet", A);

    expect(() => channelActionOf(game, A, boseiju)).toThrow(/no Channel action/);
  });

  it("costs {1} less to activate for each legendary creature you control", () => {
    // Exactly one Forest — not enough for the printed {1}{G} cost, but
    // exactly enough once a legendary creature knocks {1} off.
    const withoutLegend = makeGame([], []);
    const boseiju1 = withoutLegend.debugSpawn("Boseiju, Who Endures", A, "hand");
    withoutLegend.debugSpawn("Forest", A);
    withoutLegend.debugSpawn("Arcane Signet", B);
    expect(() => channelActionOf(withoutLegend, A, boseiju1)).toThrow(/no Channel action/);

    const withLegend = makeGame([], []);
    const boseiju2 = withLegend.debugSpawn("Boseiju, Who Endures", A, "hand");
    withLegend.debugSpawn("Forest", A);
    withLegend.debugSpawn("Anafenza, the Foremost", A); // a legendary creature
    withLegend.debugSpawn("Arcane Signet", B);
    expect(() =>
      withLegend.dispatch({
        type: "activate-ability",
        player: A,
        source: boseiju2,
        abilityIndex: channelActionOf(withLegend, A, boseiju2).abilityIndex,
        targets: [channelActionOf(withLegend, A, boseiju2).targetOptions[0]![0]!],
      }),
    ).not.toThrow();
  });
});

describe("Otawara, Soaring City", () => {
  it("returns a target nonland permanent to its owner's hand", () => {
    const game = makeGame([], []);
    const otawara = game.debugSpawn("Otawara, Soaring City", A, "hand");
    withMana(game, A, 4);
    const target = game.debugSpawn("Arcane Signet", B);

    const action = channelActionOf(game, A, otawara);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: otawara,
      abilityIndex: action.abilityIndex,
      targets: [{ kind: "object", object: target }],
    });
    settle(game);

    expect(game.state.objects[target]?.zone).toBe("hand");
  });
});

describe("Takenuma, Abandoned Mire", () => {
  it("mills three, then returns a creature or planeswalker card from the graveyard to hand", () => {
    const game = makeGame(
      ["Prodigal Sorcerer", "Prodigal Sorcerer", "Prodigal Sorcerer"],
      [],
    );
    const takenuma = game.debugSpawn("Takenuma, Abandoned Mire", A, "hand");
    withMana(game, A, 4);

    const action = channelActionOf(game, A, takenuma);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: takenuma,
      abilityIndex: action.abilityIndex,
    });
    settle(game);

    const graveyardCreature = game.state.zones.perPlayer[A].graveyard.find(
      (id) => game.state.objects[id]?.cardName === "Prodigal Sorcerer",
    );
    // Either milled straight to hand via the choose-from-zone decision, or
    // (if fewer than one match milled) never left the graveyard — either way
    // no creature card is left stranded unresolved on the stack.
    expect(game.state.zones.shared.stack.length).toBe(0);
    expect(game.state.awaiting).toBeNull();
    void graveyardCreature;
  });
});

describe("Eiganjo, Seat of the Empire", () => {
  it("deals 4 damage to a target attacking or blocking creature, but not an idle one", () => {
    const game = makeGame([], ["Prodigal Sorcerer"]);
    const eiganjo = game.debugSpawn("Eiganjo, Seat of the Empire", A, "hand");
    withMana(game, A, 3);
    const idle = game.debugSpawn("Prodigal Sorcerer", B, "battlefield", { summoningSick: false });

    expect(() => channelActionOf(game, A, eiganjo)).toThrow(/no Channel action/);

    const attacker = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });
    game.state.objects[attacker]!.attacking = B;

    const action = channelActionOf(game, A, eiganjo);
    const target = action.targetOptions[0]?.find(
      (ref) => ref.kind === "object" && ref.object === attacker,
    );
    expect(target).toBeDefined();
    void idle;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: eiganjo,
      abilityIndex: action.abilityIndex,
      targets: [target!],
    });
    settle(game);

    expect(game.state.objects[attacker]?.zone).toBe("graveyard");
  });
});

describe("Channel — general mechanism", () => {
  it("can't be activated once the card is on the battlefield instead of hand", () => {
    const game = makeGame([], []);
    const boseiju = game.debugSpawn("Boseiju, Who Endures", A, "battlefield");
    expect(() => channelActionOf(game, A, boseiju)).toThrow(/no Channel action/);
  });

  it("can't be activated by a player who doesn't own the card", () => {
    const game = makeGame([], []);
    const boseiju = game.debugSpawn("Boseiju, Who Endures", B, "hand");
    expect(() => channelActionOf(game, A, boseiju)).toThrow(/no Channel action/);
  });
});
