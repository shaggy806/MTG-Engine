import { defineCard } from "../define.js";

const DIES_TEXT =
  "When this creature dies, proliferate. (Choose any number of permanents and/or players, then give each " +
  "another counter of each kind already there.)";

export default defineCard({
  name: "Blightbelly Rat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Rat"],
  power: 2,
  toughness: 2,
  toxic: 1,
  text: `Toxic 1 (Players dealt combat damage by this creature also get a poison counter.)\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
