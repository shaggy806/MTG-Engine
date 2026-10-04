import { defineCard } from "../define.js";

// EDHREC rank 6163.
//
// Rulings:
//   [2022-12-08] When you cycle this card, first the cycling ability goes on the stack, then the
//     triggered ability goes on the stack on top of it. The triggered ability will resolve before
//     you draw a card from the cycling ability.
//   [2022-12-08] You can cycle this card even if there are no legal targets for the triggered
//     ability.
//   [2022-12-08] The cycling ability and the triggered ability are separate.
// X counts every Goblin on the battlefield, each player's, as the trigger resolves.

const CYCLE_TEXT =
  "When you cycle this card, you may have it deal X damage to target creature, where X is the number of Goblins on the battlefield.";

export default defineCard({
  name: "Gempalm Incinerator",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 1,
  cycling: { cost: "{1}{R}" },
  text: `Cycling {1}{R} ({1}{R}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: ["creature"],
      effect: {
        kind: "may",
        prompt: "Deal X damage to the target creature?",
        effect: { kind: "damage", amount: { countOf: { subtype: "Goblin" } }, target: 0 },
      },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
