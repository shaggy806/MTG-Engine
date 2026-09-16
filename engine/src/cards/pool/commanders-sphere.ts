import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// "in your commander's color identity" is modelled as plain `"any-color"`, the
// same approximation `arcane-signet.ts` makes. In a deck that passes
// `validateCommanderDeck` the two are indistinguishable: every card the mana
// could be spent on is already inside that identity.
export default defineCard({
  name: "Commander's Sphere",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "{T}: Add one mana of any color in your commander's color identity.\n" +
    "Sacrifice Commander's Sphere: Draw a card.",
  activated: [
    addManaAbility({
      mana: "any-color",
      text: "{T}: Add one mana of any color in your commander's color identity.",
    }),
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Sacrifice Commander's Sphere: Draw a card.",
    },
  ],
});
