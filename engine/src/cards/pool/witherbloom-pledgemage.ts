import { defineCard } from "../define.js";

export default defineCard({
  name: "Witherbloom Pledgemage",
  manaCost: "{3}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Warlock"],
  power: 5,
  toughness: 5,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, you gain 1 life.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, you gain 1 life.",
    },
  ],
});
