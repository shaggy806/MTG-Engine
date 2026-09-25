import { defineCard } from "../define.js";

export default defineCard({
  name: "Primal Rage",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Creatures you control have trample. (A creature with trample can deal excess combat damage to the player or planeswalker it's attacking.)",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["trample"],
      text: "Creatures you control have trample.",
    },
  ],
});
