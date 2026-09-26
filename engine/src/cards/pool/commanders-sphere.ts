import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// Only your commanders' colours (`PlayerState.commanderIdentity`), and no
// mana at all without a commander, or with a colourless one (the rulings).
export default defineCard({
  name: "Commander's Sphere",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "{T}: Add one mana of any color in your commander's color identity.\n" +
    "Sacrifice Commander's Sphere: Draw a card.",
  activated: [
    addManaAbility({
      mana: "commander-identity",
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
