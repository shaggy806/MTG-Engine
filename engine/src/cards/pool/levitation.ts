import { defineCard } from "../define.js";

export default defineCard({
  name: "Levitation",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Creatures you control have flying.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["flying"],
      text: "Creatures you control have flying.",
    },
  ],
});
