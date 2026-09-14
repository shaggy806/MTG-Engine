import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Artist",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 0,
  toughness: 1,
  text:
    "Whenever Blood Artist or another creature dies, target player loses 1 life and you gain " +
    "1 life.",
  triggered: [
    {
      // `who: "any"` with no `otherOnly` — "this creature **or another**",
      // i.e. every creature anyone controls, this one included.
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text:
        "Whenever Blood Artist or another creature dies, target player loses 1 life and you " +
        "gain 1 life.",
    },
  ],
});
