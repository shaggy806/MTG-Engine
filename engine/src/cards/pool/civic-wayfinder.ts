import { defineCard } from "../define.js";

export default defineCard({
  name: "Civic Wayfinder",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid", "Warrior"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
