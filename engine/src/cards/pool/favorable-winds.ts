import { defineCard } from "../define.js";

export default defineCard({
  name: "Favorable Winds",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Creatures you control with flying get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "flying" },
      grantPt: [1, 1],
      text: "Creatures you control with flying get +1/+1.",
    },
  ],
});
