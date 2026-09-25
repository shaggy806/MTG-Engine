import { defineCard } from "../define.js";

export default defineCard({
  name: "Willow-Wind",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, scry 2.",
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
