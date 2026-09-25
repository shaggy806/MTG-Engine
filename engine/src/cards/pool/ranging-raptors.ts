import { defineCard } from "../define.js";

export default defineCard({
  name: "Ranging Raptors",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 3,
  text: "Enrage — Whenever this creature is dealt damage, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
