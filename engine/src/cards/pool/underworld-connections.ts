import { defineCard } from "../define.js";

// EDHREC rank 5147.
// Presence of Gond's shape: the enchanted permanent's own granted ability, so
// the land's controller activates it and pays the life.

const GRANTED_TEXT = "{T}, Pay 1 life: Draw a card.";
const TEXT = `Enchanted land has "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Underworld Connections",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${TEXT}`,
  targets: ["land"],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true, payLife: 1 },
          targets: [],
          effect: { kind: "draw", amount: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
