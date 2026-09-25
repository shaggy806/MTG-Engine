import { defineCard } from "../define.js";

export default defineCard({
  name: "Dictate of Erebos",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: "Flash\nWhenever a creature you control dies, each opponent sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "Whenever a creature you control dies, each opponent sacrifices a creature of their choice.",
    },
  ],
});
