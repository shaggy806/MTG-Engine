import { defineCard } from "../define.js";

// EDHREC rank 6059.

const TEXT = "When this creature enters, you gain 1 life and draw a card.";

export default defineCard({
  name: "Priest of Ancient Lore",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Cleric"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
