import { defineCard } from "../define.js";

// "A Forest card" is any card with the Forest land type — a typed dual
// counts — and it enters untapped.
export default defineCard({
  name: "Wood Elves",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 1,
  toughness: 1,
  text:
    "When this creature enters, search your library for a Forest card, put that card onto the battlefield, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Forest" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text:
        "When this creature enters, search your library for a Forest card, put that card onto the battlefield, then shuffle.",
    },
  ],
});
