import { defineCard } from "../define.js";

export default defineCard({
  name: "Huatli's Raptor",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nWhen this creature enters, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "When this creature enters, proliferate.",
    },
  ],
});
