import { defineCard } from "../define.js";

export default defineCard({
  name: "Kor Cartographer",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Scout"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may search your library for a Plains card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Plains" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a Plains card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
