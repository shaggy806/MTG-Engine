import { defineCard } from "../define.js";

export default defineCard({
  name: "Martyr for the Cause",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "When this creature dies, proliferate.",
    },
  ],
});
