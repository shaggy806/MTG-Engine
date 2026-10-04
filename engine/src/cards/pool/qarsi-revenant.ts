import { defineCard } from "../define.js";

// EDHREC rank 2379.
//
// Rulings:
//   [2025-04-04] If a card with a renew ability is put into your graveyard during your turn, you
//     can activate that ability if it's legal to do so before any other player can take any
//     actions.

export default defineCard({
  name: "Qarsi Revenant",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "deathtouch", "lifelink"],
  text: "Flying, deathtouch, lifelink\nRenew — {2}{B}, Exile this card from your graveyard: Put a flying counter, a deathtouch counter, and a lifelink counter on target creature. Activate only as a sorcery.",
  activated: [
    {
      // `zone: "graveyard"` pays "Exile this card from your graveyard" (Adorned Crocodile's renew).
      cost: { mana: "{2}{B}", tap: false },
      targets: ["creature"],
      // Keyword counters (rule 122.1b).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "flying", amount: 1 },
          { kind: "add-counter", target: 0, counter: "deathtouch", amount: 1 },
          { kind: "add-counter", target: 0, counter: "lifelink", amount: 1 },
        ],
      },
      resolve: null,
      text: "Renew — {2}{B}, Exile this card from your graveyard: Put a flying counter, a deathtouch counter, and a lifelink counter on target creature. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
