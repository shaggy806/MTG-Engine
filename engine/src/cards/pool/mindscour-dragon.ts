import { defineCard } from "../define.js";

export default defineCard({
  name: "Mindscour Dragon",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature deals combat damage to an opponent, target player mills four cards.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 4 },
      resolve: null,
      text: "Whenever this creature deals combat damage to an opponent, target player mills four cards.",
    },
  ],
});
