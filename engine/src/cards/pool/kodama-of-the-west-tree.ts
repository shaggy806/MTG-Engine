import { defineCard } from "../define.js";

const TRAMPLE_TEXT =
  "Modified creatures you control have trample. (Equipment, Auras you control, and counters are modifications.)";
const SEARCH_TEXT =
  "Whenever a modified creature you control deals combat damage to a player, search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

// Modified (rule 700.9): any counter, whoever put it there; any Equipment,
// whoever controls it; an Aura only if its controller controls the creature
// (the rulings).
export default defineCard({
  name: "Kodama of the West Tree",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach\n${TRAMPLE_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", modified: true } },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { modified: true } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
