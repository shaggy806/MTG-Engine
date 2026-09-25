import { defineCard } from "../define.js";

export default defineCard({
  name: "Madrush Cyclops",
  manaCost: "{1}{B}{R}{G}",
  colors: ["B", "R", "G"],
  types: ["creature"],
  subtypes: ["Cyclops", "Warrior"],
  power: 3,
  toughness: 4,
  text: "Creatures you control have haste.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
