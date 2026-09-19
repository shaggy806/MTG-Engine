import { defineCard } from "../define.js";

/** The "put a land from your hand onto the battlefield" family — a
 * `look-and-choose` over `zone: "hand"`. `min: 0` is the "**you may**", and
 * `leftover: "stay"` is what makes the rest of the hand stay a hand. */
export default defineCard({
  name: "Growth Spiral",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["instant"],
  text: "Draw a card. You may put a land card from your hand onto the battlefield.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 1 },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
    ],
  },
});
