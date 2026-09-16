import { defineCard } from "../define.js";

export default defineCard({
  name: "Rapacious Dragon",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, create two Treasure tokens.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: "When Rapacious Dragon enters, create two Treasure tokens.",
    },
  ],
});
