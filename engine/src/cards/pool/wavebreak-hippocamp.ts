import { defineCard } from "../define.js";

// EDHREC rank 2410. Alela, Cunning Conqueror's shape: the caster's first
// spell of the turn, on a turn that isn't theirs — every other player is an
// opponent, so that's "each opponent's turn", once per such turn.
const TEXT = "Whenever you cast your first spell during each opponent's turn, draw a card.";

export default defineCard({
  name: "Wavebreak Hippocamp",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Horse", "Fish"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true },
      condition: { kind: "not", of: { kind: "your-turn" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
