import { defineCard } from "../define.js";

const DISCARD_TEXT = "Whenever you discard a card, this creature deals 1 damage to each opponent.";
const LOOT_TEXT = "{1}{R}, Discard a card: Draw a card. Activate only if this creature is attacking.";

// Once per card discarded, the discard its own ability costs included.
export default defineCard({
  name: "Glint-Horn Buccaneer",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Pirate"],
  power: 2,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${DISCARD_TEXT}\n${LOOT_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, discard: { count: 1 } },
      condition: { kind: "source", filter: { attacking: true } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
