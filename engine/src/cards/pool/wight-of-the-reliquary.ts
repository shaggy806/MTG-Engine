import { defineCard } from "../define.js";

const PUMP_TEXT = "This creature gets +1/+1 for each creature card in your graveyard.";
const SEARCH_TEXT =
  "{T}, Sacrifice another creature: Search your library for a land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Wight of the Reliquary",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: `Vigilance\n${PUMP_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { type: "creature", ownedBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
