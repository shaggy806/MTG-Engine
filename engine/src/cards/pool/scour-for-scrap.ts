import { defineCard } from "../define.js";

export default defineCard({
  name: "Scour for Scrap",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Choose one or both —\n• Search your library for an artifact card, reveal it, put it into your hand, then shuffle.\n• Return target artifact card from your graveyard to your hand.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Search your library for an artifact card, reveal it, put it into your hand, then shuffle.",
        effect: {
          kind: "search-library",
          filter: { type: "artifact" },
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      {
        text: "Return target artifact card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
    ],
  },
});
