import { defineCard } from "../define.js";

// "A Plains card" is any card with the Plains land type, and it enters
// untapped. The land comparison is an intervening-if (rule 603.4).
export default defineCard({
  name: "Knight of the White Orchid",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text:
    "First strike\n" +
    "When this creature enters, if an opponent controls more lands than you, you may search your library for a Plains card, put it onto the battlefield, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Plains card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Plains" },
          destination: "battlefield",
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text:
        "When this creature enters, if an opponent controls more lands than you, you may search your library for a Plains card, put it onto the battlefield, then shuffle.",
    },
  ],
});
