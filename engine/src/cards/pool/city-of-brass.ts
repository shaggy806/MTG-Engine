import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// The damage is a "becomes tapped" *trigger*, not a rider on the mana ability
// — City of Brass hurts however it got tapped (an opponent's tap effect, a
// cost that taps it), so `painToController` would undercount it.
export default defineCard({
  name: "City of Brass",
  types: ["land"],
  text:
    "Whenever City of Brass becomes tapped, it deals 1 damage to you.\n" +
    "{T}: Add one mana of any color.",
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "you" },
      resolve: null,
      text: "Whenever City of Brass becomes tapped, it deals 1 damage to you.",
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
