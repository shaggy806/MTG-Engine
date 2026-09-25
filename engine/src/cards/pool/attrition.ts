import { defineCard } from "../define.js";

export default defineCard({
  name: "Attrition",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{B}, Sacrifice a creature: Destroy target nonblack creature.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: "creature-you-control" },
      targets: ["nonblack-creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{B}, Sacrifice a creature: Destroy target nonblack creature.",
    },
  ],
});
