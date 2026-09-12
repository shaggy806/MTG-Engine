import { defineCard } from "../define.js";

// needed-cards P16. New: EffectSpec "add-counter" gains a live-count amount
// (mirrors modify-pt's power/toughness already being an EffectAmount).
// Drops "if you control a commander as you cast this spell, you may choose
// both instead" — castModal's minModes/maxModes are fixed per card, not
// conditional on board state at cast time; approximated as a plain "choose
// one," the common case.
export default defineCard({
  name: "Will of the Sultai",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Choose one —\n" +
    "• Target player mills three cards. Return all land cards from your graveyard to the battlefield tapped.\n" +
    "• Put X +1/+1 counters on target creature, where X is the number of lands you control. It gains trample until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text:
          "Target player mills three cards. Return all land cards from your graveyard to " +
          "the battlefield tapped.",
        targets: ["player"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "mill", target: 0, amount: 3 },
            {
              kind: "return-from-graveyard",
              filter: { type: "land" },
              destination: "battlefield",
              count: "all",
              enterTapped: true,
            },
          ],
        },
      },
      {
        text:
          "Put X +1/+1 counters on target creature, where X is the number of lands you " +
          "control. It gains trample until end of turn.",
        targets: ["creature"],
        effect: {
          kind: "sequence",
          effects: [
            {
              kind: "add-counter",
              target: 0,
              counter: "+1/+1",
              amount: { countOf: { type: "land", controlledBy: "you" } },
            },
            { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
