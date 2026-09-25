import { defineCard } from "../define.js";

export default defineCard({
  name: "Sage's Row Savant",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, scry 2.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature enters, scry 2.",
    },
  ],
});
