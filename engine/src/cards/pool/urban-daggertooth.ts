import { defineCard } from "../define.js";

export default defineCard({
  name: "Urban Daggertooth",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 4,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nEnrage — Whenever this creature is dealt damage, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, proliferate.",
    },
  ],
});
