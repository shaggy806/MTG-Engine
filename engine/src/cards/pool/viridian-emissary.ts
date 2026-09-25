import { defineCard } from "../define.js";

export default defineCard({
  name: "Viridian Emissary",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Elf", "Scout"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
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
      text: "When this creature dies, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
