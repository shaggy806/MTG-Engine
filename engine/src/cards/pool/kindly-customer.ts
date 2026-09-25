import { defineCard } from "../define.js";

export default defineCard({
  name: "Kindly Customer",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, draw a card.",
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
