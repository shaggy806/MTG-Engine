import { defineCard } from "../define.js";

// EDHREC rank 5467.
//
// Rulings:
//   [2008-04-01] If the creature has 1 power, this ability lets you look at the top card of your
//     library, then you'll have to leave it there.
//   [2008-04-01] The creature's power is checked as this ability resolves. If the creature has
//     left the battlefield, use its last known information.
//   [2008-04-01] If the creature has 0 power, this ability has no effect.

const TEXT =
  "Whenever a creature you control enters, you may look at the top X cards of your library, where X is that creature's power. If you do, put one of those cards on top of your library and the rest on the bottom of your library in any order.";

export default defineCard({
  name: "Cream of the Crop",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Look at the top cards of your library?",
        // X is the creature's power as this resolves, as it last existed if
        // it has left (the ruling); 0 power looks at nothing.
        effect: {
          kind: "look-and-choose",
          zone: "library",
          count: { powerOf: "trigger-object" },
          min: 1,
          max: 1,
          destination: "library-top",
          leftover: "bottom-any-order",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
