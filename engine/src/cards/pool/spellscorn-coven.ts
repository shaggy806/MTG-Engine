import { defineCard } from "../define.js";

export default defineCard({
  name: "Spellscorn Coven",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Warlock"],
  power: 2,
  toughness: 3,
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
  faces: ["Spellscorn Coven", "Take It Back"],
  adventure: true,
});
