import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 2729.
//
// Rulings:
//   [2024-02-02] If Vein Ripper dies at the same time as one or more other creatures, its last
//     ability triggers for each of those creatures.
//
// "Whenever a creature dies" includes Vein Ripper itself (a leaves-the-battlefield
// trigger looks back in time).
const WARD = ward({ sacrifice: { filter: { type: "creature" }, text: "Sacrifice a creature" } });
const DRAIN_TEXT = "Whenever a creature dies, target opponent loses 2 life and you gain 2 life.";

export default defineCard({
  name: "Vein Ripper",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Assassin"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${WARD.text}\n${DRAIN_TEXT}`,
  triggered: [
    WARD,
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, target: 0 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
