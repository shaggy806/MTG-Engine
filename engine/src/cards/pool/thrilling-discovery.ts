import { defineCard } from "../define.js";

// EDHREC rank 4167.

// The discard is offered only with two cards in hand (`may`'s feasibility
// check), and "if you do" is both of them discarded.
export default defineCard({
  name: "Thrilling Discovery",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  text: "You gain 2 life. Then you may discard two cards. If you do, draw three cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-life", amount: 2 },
      {
        kind: "may",
        prompt: "Discard two cards to draw three cards?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 2 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded", atLeast: 2 },
              then: { kind: "draw", amount: 3 },
            },
          ],
        },
      },
    ],
  },
});
