import { defineCard } from "../define.js";

export default defineCard({
  name: "Baleful Strix",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch\nWhen this creature enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature enters, draw a card.",
    },
  ],
});
