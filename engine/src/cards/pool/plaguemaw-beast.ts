import { defineCard } from "../define.js";

export default defineCard({
  name: "Plaguemaw Beast",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 4,
  toughness: 3,
  text: "{T}, Sacrifice a creature: Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{T}, Sacrifice a creature: Proliferate.",
    },
  ],
});
