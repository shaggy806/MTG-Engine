import { defineCard } from "../define.js";

// EDHREC rank 3872.
//
// Rulings:
//   [2004-10-04] It will never reduce any colored mana portion of an activation cost.
//   [2004-10-04] It will not add a {1} to abilities with no generic mana in their activation cost.
//   [2004-10-04] The cost reduction can be applied to additional costs.
//   [2006-07-15] Can’t reduce Snow mana costs.
//   [2016-06-08] Activated abilities contain a colon. They’re generally written “[Cost]:
//     [Effect].” Some keywords are activated abilities and will have colons in their reminder
//     text.

export default defineCard({
  name: "Heartstone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "Activated abilities of creatures cost {1} less to activate. This effect can't reduce the mana in that cost to less than one mana.",
  static: [
    {
      // Every player's creatures, mana abilities included; generic only.
      affects: { scope: "self" },
      abilityCostModification: { applies: { type: "creature" }, reduceGeneric: 1, leavesOneMana: true },
      text: "Activated abilities of creatures cost {1} less to activate. This effect can't reduce the mana in that cost to less than one mana.",
    },
  ],
});
