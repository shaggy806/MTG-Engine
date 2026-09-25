import { defineCard } from "../define.js";

export default defineCard({
  name: "Go Forth",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Choose one —\n• Search your library for a basic land card, reveal it, put it into your hand, then shuffle.\n• Target creature gets +2/+2 until end of turn.",
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
        text: "Target creature gets +2/+2 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      },
    ],
  },
});
