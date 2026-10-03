import { defineCard } from "../define.js";

const MANA_TEXT = "{T}, Pay 1 life: Add one mana of any type that a land you control could produce.";
const LAND_TEXT = "{3}, {T}: You may put a land card from your hand onto the battlefield tapped.";
const DRAW_TEXT = "{1}, {T}, Sacrifice this land: Draw a card.";

// "Any type" — colorless included — that a land you control could produce
// (rule 106.7: costs and legality ignored, the ruling).
export default defineCard({
  name: "Horizon of Progress",
  types: ["land"],
  text: `${MANA_TEXT}\n${LAND_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: { producedBy: "your-lands", anyType: true }, amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        enterTapped: true,
        leftover: "stay",
        filter: { type: "land" },
      },
      resolve: null,
      text: LAND_TEXT,
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
