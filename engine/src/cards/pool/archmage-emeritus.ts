import { defineCard } from "../define.js";

// Magecraft: a cast trigger that also fires on a copy (`orCopy`).
export default defineCard({
  name: "Archmage Emeritus",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, draw a card.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, draw a card.",
    },
  ],
});
