import { defineCard } from "../define.js";

// EDHREC rank 4596.

// "Your maximum hand size is ten" is Twenty-Toed Toad's `maxHandSize.set`.
// The end-step draw is an intervening "if" (rule 603.4), checked as it
// triggers and again as it resolves; the difference is counted then, in one
// draw of that many (Sandstone Oracle's `difference`).
const HAND_TEXT = "Your maximum hand size is ten.";
const DRAW_TEXT =
  "At the beginning of your end step, if you have fewer than ten cards in hand, draw cards equal to the difference.";

export default defineCard({
  name: "The Ten Rings",
  manaCost: "{8}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${HAND_TEXT}\n${DRAW_TEXT}`,
  static: [{ affects: { scope: "self" }, maxHandSize: { who: "you", set: 10 }, text: HAND_TEXT }],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "hand-size", atMost: 9 },
      targets: [],
      effect: { kind: "draw", amount: { difference: [10, { cardsInHand: "you" }] } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
