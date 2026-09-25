import { defineCard } from "../define.js";

export default defineCard({
  name: "Flux Channeler",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Whenever you cast a noncreature spell, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, proliferate.",
    },
  ],
});
