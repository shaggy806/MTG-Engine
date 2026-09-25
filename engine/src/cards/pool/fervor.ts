import { defineCard } from "../define.js";

export default defineCard({
  name: "Fervor",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Creatures you control have haste. (They can attack and {T} as soon as they come under your control.)",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
