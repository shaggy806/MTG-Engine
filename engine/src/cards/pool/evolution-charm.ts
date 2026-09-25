import { defineCard } from "../define.js";

export default defineCard({
  name: "Evolution Charm",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Choose one —\n• Search your library for a basic land card, reveal it, put it into your hand, then shuffle.\n• Return target creature card from your graveyard to your hand.\n• Target creature gains flying until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      {
        text: "Return target creature card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Target creature gains flying until end of turn.",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      },
    ],
  },
});
