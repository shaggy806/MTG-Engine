import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyscanner",
  manaCost: "{3}",
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen Skyscanner enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Skyscanner enters, draw a card.",
    },
  ],
});
