import { defineCard } from "../define.js";

// EDHREC rank 2671.
//
// Rulings:
//   [2013-04-15] A creature that deals combat damage to a player must have a +1/+1 counter on it
//     at the time damage is dealt in order for Bred for the Hunt's ability to trigger.

const TEXT =
  "Whenever a creature you control with a +1/+1 counter on it deals combat damage to a player, you may draw a card.";

export default defineCard({
  name: "Bred for the Hunt",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
