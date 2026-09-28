/**
 * `Game.legalActivationsOf` is `legalActions` narrowed to one permanent or
 * card's activated abilities — what a bot's batch asks between activations,
 * because the whole list plans a mana payment for every ability on the
 * board. It must be exactly that narrowing: same offers, same order, at every
 * priority window of a real game.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { SAMPLE_DECKS } from "../sample-decks.js";
import { COMMANDER_RULES } from "../state.js";

const SEATS = ["alice", "bob", "carol", "dave"].map(asPlayerId);

describe("legalActivationsOf", () => {
  it("is legalActions narrowed to one source, at every window of a game", () => {
    let game: Game | undefined;
    let checked = 0;
    const checking = (inner: PlayerController): PlayerController => ({
      act(view: ControllerView) {
        const g = game;
        if (g !== undefined && view.state.awaiting === null && view.state.priority.holder === view.player) {
          const all = g.legalActions(view.player);
          const sources = new Set<ObjectId>();
          for (const l of all) if (l.kind === "activate-ability") sources.add(l.source);
          for (const source of sources) {
            const narrowed = g.legalActivationsOf(view.player, source);
            const expected = all.filter(
              (l): l is Extract<LegalAction, { kind: "activate-ability" }> =>
                l.kind === "activate-ability" && l.source === source,
            );
            expect(narrowed).toEqual(expected);
            checked += 1;
          }
          // And a source with nothing to activate offers nothing.
          const hand = view.state.zones.perPlayer[view.player].hand[0];
          if (hand !== undefined && !sources.has(hand)) {
            expect(g.legalActivationsOf(view.player, hand)).toEqual([]);
          }
        }
        return inner.act(view);
      },
    });
    game = Game.create({
      seed: 7,
      mulligans: true,
      rules: COMMANDER_RULES,
      controllers: Object.fromEntries(
        SEATS.map((p) => [p, checking(new HeuristicBotController(p))]),
      ),
      decks: SEATS.map((player, i) => ({
        player,
        cards: SAMPLE_DECKS[i].cards,
        commander: SAMPLE_DECKS[i].commander,
      })),
    });
    game.advanceUntil((s) => s.turn.number > 24);
    expect(checked).toBeGreaterThan(100);
  });
});
