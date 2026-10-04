import { defineCard } from "../define.js";

// EDHREC rank 5543.
//
// Rulings:
//   [2015-08-25] If more than one Breaker of Armies is attacking, the controller of each creature
//     that could block them chooses which one that creature blocks. In this case, creatures that
//     can block multiple creatures must block as many attacking Breaker of Armies as possible.
//   [2015-08-25] If, during its controller's declare blockers step, a creature the defending
//     player controls is tapped or is affected by a spell or ability that says it can't block,
//     then it doesn't block. If there's a cost associated with having it block, its controller
//     isn't forced to pay that cost. If they don't, the creature doesn't have to block.
//   [2015-08-25] If a creature can't legally block Breaker of Armies but could block another
//     attacking creature, it may do so. Likewise, if a creature the defending player controls
//     can't block Breaker of Armies unless its controller pays a cost, its controller may decline
//     to pay that cost and block a different attacking creature.
//
// Lure's requirement on itself (rule 509.1c — `combat/blocking.ts`'s
// `lurePlan`, which also settles several Breakers attacking at once).

const TEXT = "All creatures able to block this creature do so.";

export default defineCard({
  name: "Breaker of Armies",
  manaCost: "{8}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 8,
  text: TEXT,
  static: [{ affects: { scope: "self" }, restrictions: ["must-be-blocked"], text: TEXT }],
});
