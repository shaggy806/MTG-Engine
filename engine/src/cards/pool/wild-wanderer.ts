import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Wanderer",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
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
      text: "When this creature enters, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
