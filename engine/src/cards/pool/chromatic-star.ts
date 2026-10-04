import { defineCard } from "../define.js";

// EDHREC rank 2830.

const MANA_TEXT = "{1}, {T}, Sacrifice this artifact: Add one mana of any color.";
const DRAW_TEXT = "When this artifact is put into a graveyard from the battlefield, draw a card.";

export default defineCard({
  name: "Chromatic Star",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: `${MANA_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
