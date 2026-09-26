import { defineCard } from "../define.js";

const TEXT =
  "Whenever this creature or another creature or planeswalker you control dies, each opponent loses 1 life and you gain 1 life.";

// Once per permanent — a creature planeswalker dying triggers it once (the
// ruling) — and it sees the ones that die alongside it.
export default defineCard({
  name: "Cruel Celebrant",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { typesAnyOf: ["creature", "planeswalker"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
