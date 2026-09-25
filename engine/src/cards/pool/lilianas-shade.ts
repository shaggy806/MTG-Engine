import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Shade",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shade"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, you may search your library for a Swamp card, reveal it, put it into your hand, then shuffle.\n{B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Swamp" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a Swamp card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
