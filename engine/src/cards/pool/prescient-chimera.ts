import { defineCard } from "../define.js";

export default defineCard({
  name: "Prescient Chimera",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Chimera"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an instant or sorcery spell, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, scry 1.",
    },
  ],
});
