import { defineCard } from "../define.js";

// EDHREC rank 6536.
//
// Rulings:
//   [2009-02-01] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs. You can pay optional additional costs, and must still pay
//     mandatory additional costs.
//   [2009-02-01] You cast it as part of the resolution of the triggered ability. Timing
//     restrictions based on the card's type are ignored. Other casting restrictions are not.
//   [2009-02-01] If you cast a card with X in its cost this way, X must be 0.

const TEXT =
  "Whenever this creature deals combat damage to a player, you may cast a spell from your hand without paying its mana cost.";

export default defineCard({
  name: "Maelstrom Archangel",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "cast-now", from: "hand", free: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
