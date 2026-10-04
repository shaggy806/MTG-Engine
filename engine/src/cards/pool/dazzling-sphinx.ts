import { defineCard } from "../define.js";

// EDHREC rank 6184.
//
// Rulings:
//   [2021-04-16] Dazzling Sphinx's triggered ability lets you cast the exiled card during the
//     resolution of the ability. It doesn't allow you to wait and cast the card later.
//   [2021-04-16] If the exiled instant or sorcery card has an {X} in its mana cost, you must
//     choose 0 as the value of {X}.
//   [2021-04-16] You may choose not to cast the instant or sorcery card that you exiled. In that
//     case, it will be put on the bottom of the library with the rest of the exiled cards.
// The same trigger as Gríma, Saruman's Footman's, word for word.

const TRIGGER_TEXT =
  "Whenever this creature deals combat damage to a player, that player exiles cards from the top of their library until they exile an instant or sorcery card. You may cast that card without paying its mana cost. Then that player puts the exiled cards that weren't cast this way on the bottom of their library in a random order.";

export default defineCard({
  name: "Dazzling Sphinx",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        // The player dealt damage — "that player".
        whose: "that-player",
        filter: { typesAnyOf: ["instant", "sorcery"] },
        exile: true,
        then: { kind: "cast-now", target: 0, free: true },
        // The card found goes with the rest unless it was cast (the ruling).
        rest: "bottom-random",
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
