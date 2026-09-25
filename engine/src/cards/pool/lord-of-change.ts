import { defineCard } from "../define.js";

export default defineCard({
  name: "Lord of Change",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying, ward {3}\nArchitect of Deception — When this creature enters, draw three cards.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{3}" } },
      resolve: null,
      text: "Ward {3}",
    },
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: "Architect of Deception — When this creature enters, draw three cards.",
    },
  ],
});
