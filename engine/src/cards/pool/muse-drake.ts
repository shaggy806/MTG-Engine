import { defineCard } from "../define.js";

export default defineCard({
  name: "Muse Drake",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, draw a card.",
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
