import { defineCard } from "../define.js";

const SEARCH_TEXT = "Search your library for a basic land card, reveal it, put it into your hand, then shuffle.";
const FIGHT_TEXT = "Target creature you control fights target creature you don't control.";

// "A creature you don't control" is one an opponent controls: a free-for-all
// table has no teammates.
export default defineCard({
  name: "Bushwhack",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: `Choose one —\n• ${SEARCH_TEXT}\n• ${FIGHT_TEXT} (Each deals damage equal to its power to the other.)`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: SEARCH_TEXT,
        targets: [],
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
        text: FIGHT_TEXT,
        targets: ["creature-you-control", "creature-an-opponent-controls"],
        effect: { kind: "fight", a: 0, b: 1 },
      },
    ],
  },
});
