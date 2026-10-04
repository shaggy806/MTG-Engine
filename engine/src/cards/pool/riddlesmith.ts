import { defineCard } from "../define.js";

// EDHREC rank 5550.
//
// Rulings:
//   [2020-08-07] You draw a card and discard a card all while Riddlesmith's ability is resolving.
//     Nothing can happen between the two, and no player may choose to take actions.
//   [2020-08-07] An ability that triggers when a player casts a spell resolves before the spell
//     that caused it to trigger. It resolves even if that spell is countered.
const TEXT = "Whenever you cast an artifact spell, you may draw a card. If you do, discard a card.";

export default defineCard({
  name: "Riddlesmith",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card, then discard a card?",
        effect: { kind: "draw", amount: 1 },
        then: { kind: "discard", target: "you", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
