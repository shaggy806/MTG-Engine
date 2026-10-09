import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

const TEXT = "Whenever this creature or another creature dies, target player loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Falkenrath Noble",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    }),
  ],
});
