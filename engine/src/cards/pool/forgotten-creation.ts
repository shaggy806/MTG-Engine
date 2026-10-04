import { defineCard } from "../define.js";

// EDHREC rank 3443.
//
// Rulings:
//   [2016-04-08] Skulk matters only as blockers are chosen. Modifying either creature's power
//     after blockers are chosen won't cause the attacking creature to become unblocked.
//   [2016-04-08] The upkeep step is before the draw step, after the untap step. If you have no
//     cards in hand, you can't draw for the turn and then discard that card to draw a new one
//     because Forgotten Creation's last ability will already have triggered and resolved.
//   [2016-04-08] If you cause a creature to have 0 power or less, use the actual value (which may
//     be negative) to determine whether it can block or be blocked. A creature with skulk and 0 or
//     less power most likely won't be blocked, but it won't deal combat damage and won't trigger
//     any abilities that trigger when combat damage is dealt.
//
// "Draw that many" counts the cards actually discarded (Tolarian Winds' shape).

const TEXT =
  "At the beginning of your upkeep, you may discard all the cards in your hand. If you do, draw that many cards.";

export default defineCard({
  name: "Forgotten Creation",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 3,
  toughness: 3,
  keywords: ["skulk"],
  text: `Skulk (This creature can't be blocked by creatures with greater power.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard all the cards in your hand, then draw that many cards?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard-hand", who: "you" },
            { kind: "draw", amount: { thisWay: "discarded" } },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
