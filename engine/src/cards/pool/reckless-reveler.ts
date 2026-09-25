import { defineCard } from "../define.js";

export default defineCard({
  name: "Reckless Reveler",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 2,
  toughness: 1,
  text: "{R}, Sacrifice this creature: Destroy target artifact.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{R}, Sacrifice this creature: Destroy target artifact.",
    },
  ],
});
