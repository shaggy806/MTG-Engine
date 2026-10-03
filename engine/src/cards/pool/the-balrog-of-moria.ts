import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const DIES_TEXT =
  "When The Balrog of Moria dies, you may exile it. When you do, for each opponent, exile up to one target " +
  "creature that player controls.";
const CYCLE_TEXT = "When you cycle this card, create two Treasure tokens.";

// "You may exile it": the card in the graveyard it went to, only while it's
// still there (rule 400.7). "When you do" is a reflexive ability (rule
// 603.12) whose targets are chosen as it goes on the stack — one optional
// slot per opponent, bound to that player by seat (a game seats at most
// four) — exiled together.
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { type: "creature" } },
});

export default defineCard({
  name: "The Balrog of Moria",
  manaCost: "{4}{B}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar", "Demon"],
  power: 8,
  toughness: 8,
  keywords: ["trample", "haste"],
  cycling: { cost: "{3}{R}" },
  text: `Trample, haste\n${DIES_TEXT}\nCycling {3}{R} ({3}{R}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile The Balrog of Moria?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "reflexive-trigger",
                targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
                effect: {
                  kind: "sequence",
                  simultaneous: true,
                  effects: [
                    { kind: "exile", target: 0 },
                    { kind: "exile", target: 1 },
                    { kind: "exile", target: 2 },
                  ],
                },
                text: "When you do, for each opponent, exile up to one target creature that player controls.",
              },
            },
          ],
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
    {
      trigger: { on: "this-cycled" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
