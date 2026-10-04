import { defineCard } from "../define.js";

// EDHREC rank 3199.
//
// "That player" is whoever cast the spell — the `cast-spell` trigger object's
// controller, you included. Not a target.
export default defineCard({
  name: "Oppression",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever a player casts a spell, that player discards a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: { kind: "discard", target: "trigger-controller", amount: 1 },
      resolve: null,
      text: "Whenever a player casts a spell, that player discards a card.",
    },
  ],
});
