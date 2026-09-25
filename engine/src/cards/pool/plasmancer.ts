import { defineCard } from "../define.js";

export default defineCard({
  name: "Plasmancer",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Necron", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nDynastic Advisor — When this creature enters, search your library for a basic Swamp card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtype: "Swamp" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "Dynastic Advisor — When this creature enters, search your library for a basic Swamp card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
