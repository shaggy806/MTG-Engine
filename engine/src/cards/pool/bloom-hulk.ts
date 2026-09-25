import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloom Hulk",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Elemental"],
  power: 4,
  toughness: 4,
  text: "When this creature enters, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
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
