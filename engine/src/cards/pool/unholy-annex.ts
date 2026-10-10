import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The left door of Unholy Annex // Ritual Chamber (unholy-annex-ritual-chamber.ts). Whether you control a Demon is read as it resolves, after the draw.
const END =
  "At the beginning of your end step, draw a card. If you control a Demon, each opponent loses 2 life and you gain 2 life. Otherwise, you lose 2 life.";

export default defineCard({
  name: "Unholy Annex",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${END}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { subtype: "Demon" }, atLeast: 1 },
            then: {
              kind: "sequence",
              effects: [
                { kind: "lose-life", amount: 2, who: "each-opponent" },
                { kind: "gain-life", amount: 2 },
              ],
            },
            else: { kind: "lose-life", amount: 2, who: "you" },
          },
        ],
      },
      resolve: null,
      text: END,
    },
  ],
  faces: ["Unholy Annex // Ritual Chamber", "Unholy Annex", "Ritual Chamber"],
  split: true,
});
