import { defineCard } from "../define.js";

export default defineCard({
  name: "Inexorable Tide",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you cast a spell, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever you cast a spell, proliferate.",
    },
  ],
});
