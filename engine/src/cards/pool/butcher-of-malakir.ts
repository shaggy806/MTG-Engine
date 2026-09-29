import { defineCard } from "../define.js";

const DIES_TEXT =
  "Whenever this creature or another creature you control dies, each opponent sacrifices a creature of their choice.";

export default defineCard({
  name: "Butcher of Malakir",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
