import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Tarnished Citadel",
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add one mana of any color. This land deals 3 damage to you.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1, painToController: 3 },
      resolve: null,
      text: "{T}: Add one mana of any color. This land deals 3 damage to you.",
    },
  ],
});
