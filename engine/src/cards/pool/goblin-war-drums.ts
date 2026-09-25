import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin War Drums",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Creatures you control have menace. (They can't be blocked except by two or more creatures.)",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["menace"],
      text: "Creatures you control have menace.",
    },
  ],
});
