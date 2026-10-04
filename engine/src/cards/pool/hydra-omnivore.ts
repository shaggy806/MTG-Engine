import { defineCard } from "../define.js";

// EDHREC rank 4027.
//
// Rulings:
//   [2011-09-22] The damage dealt by Hydra Omnivore as a result of its triggered ability is not
//     combat damage (and doesn't cause the ability to trigger again).

const TEXT =
  "Whenever this creature deals combat damage to an opponent, it deals that much damage to each other opponent.";

export default defineCard({
  name: "Hydra Omnivore",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 8,
  toughness: 8,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self", toOpponent: true },
      targets: [],
      effect: { kind: "damage", amount: { triggerValue: true }, who: "each-other-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
