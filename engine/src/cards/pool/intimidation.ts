import { defineCard } from "../define.js";

export default defineCard({
  name: "Intimidation",
  manaCost: "{2}{B}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Creatures you control have fear. (They can't be blocked except by artifact creatures and/or black creatures.)",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["fear"],
      text: "Creatures you control have fear.",
    },
  ],
});
