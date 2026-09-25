import { defineCard } from "../define.js";

export default defineCard({
  name: "Umbral Collar Zealot",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 2,
  text: "Sacrifice another creature or artifact: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Sacrifice another creature or artifact: Surveil 1.",
      otherOnly: true,
    },
  ],
});
