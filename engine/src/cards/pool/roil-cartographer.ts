import { defineCard } from "../define.js";

// EDHREC rank 4969.

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, you get {E} (an energy counter).";
const DRAW_TEXT = "{T}, Pay six {E}: Draw three cards.";

export default defineCard({
  name: "Roil Cartographer",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 1,
  toughness: 3,
  text: `${LANDFALL_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "get-energy", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, payEnergy: 6 },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
