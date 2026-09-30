import { defineCard } from "../define.js";

const PUMP_TEXT = "This creature gets +2/+2 as long as there are three or more land cards in your graveyard.";
const FETCH_TEXT =
  "{2}, {T}, Sacrifice a land: Search your library for a land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Elvish Reclaimer",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 2,
  text: `${PUMP_TEXT}\n${FETCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "cards-in-graveyard", atLeast: 3, filter: { type: "land" } },
      grantPt: [2, 2],
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { type: "land" } } },
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
      text: FETCH_TEXT,
    },
  ],
});
