import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 4177.

// Tarnished Citadel's shape, entering tapped.
export default defineCard({
  name: "Grand Coliseum",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {C}.\n{T}: Add one mana of any color. This land deals 1 damage to you.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1, painToController: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color. This land deals 1 damage to you.",
    },
  ],
});
