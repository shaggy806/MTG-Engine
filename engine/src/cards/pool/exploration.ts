import { defineCard } from "../define.js";

export default defineCard({
  name: "Exploration",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "You may play an additional land on each of your turns.",
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
  ],
});
