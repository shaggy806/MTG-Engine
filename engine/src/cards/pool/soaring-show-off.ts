import { defineCard } from "../define.js";

export default defineCard({
  name: "Soaring Show-Off",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Warrior"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, each player draws a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "When this creature enters, each player draws a card.",
    },
  ],
});
