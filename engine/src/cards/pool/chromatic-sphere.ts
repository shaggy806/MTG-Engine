import { defineCard } from "../define.js";

// EDHREC rank 5186.
//
// Rulings:
//   [2026-08-05] Chromatic Sphere’s ability is not a mana ability. Players can respond to it, and
//     it can’t be activated in the middle of paying for a cost. A recent update to rule 605.1a has
//     made any abilities that move cards to or from libraries no longer mana abilities.

export default defineCard({
  name: "Chromatic Sphere",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}, Sacrifice this artifact: Add one mana of any color. Draw a card. (Activate only as an instant.)",
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "add-mana", mana: "any-color", amount: 1 }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "{1}, {T}, Sacrifice this artifact: Add one mana of any color. Draw a card.",
      // Not a mana ability (rule 605.1a: the draw moves a card from a
      // library): `isManaAbility` rejects an effect that isn't only add-mana,
      // so it uses the stack and the colour is asked as it resolves (608.2d).
    },
  ],
});
