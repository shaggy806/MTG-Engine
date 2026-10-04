import { defineCard } from "../define.js";

// EDHREC rank 3656.
//
// "If you do": the draw needs a card actually discarded, so saying yes with
// an empty hand draws nothing (Bitter Reunion's shape).
export default defineCard({
  name: "Abandon Attachments",
  manaCost: "{1}{U/R}",
  colors: ["U", "R"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "You may discard a card. If you do, draw two cards.",
  effect: {
    kind: "may",
    prompt: "Discard a card to draw two cards?",
    effect: {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "you", amount: 1 },
        {
          kind: "conditional",
          condition: { kind: "this-way", what: "discarded" },
          then: { kind: "draw", amount: 2 },
        },
      ],
    },
  },
});
