import { defineCard } from "../define.js";

export default defineCard({
  name: "Drogskol Reaver",
  manaCost: "{5}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 5,
  keywords: ["flying", "double-strike", "lifelink"],
  text: "Flying\nDouble strike (This creature deals both first-strike and regular combat damage.)\nLifelink (Damage dealt by this creature also causes you to gain that much life.)\nWhenever you gain life, draw a card.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you gain life, draw a card.",
    },
  ],
});
