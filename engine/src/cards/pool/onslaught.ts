import { defineCard } from "../define.js";

export default defineCard({
  name: "Onslaught",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever you cast a creature spell, tap target creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Whenever you cast a creature spell, tap target creature.",
    },
  ],
});
