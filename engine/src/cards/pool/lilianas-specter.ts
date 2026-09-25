import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Specter",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Specter"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, each opponent discards a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "When this creature enters, each opponent discards a card.",
    },
  ],
});
