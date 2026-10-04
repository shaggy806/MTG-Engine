import { defineCard } from "../define.js";

// EDHREC rank 5213.
//
// Rulings:
//   [2023-04-14] You don’t have to choose a target for Scrollshift. However, if you do, and that
//     permanent is an illegal target at the time Scrollshift tries to resolve, it won’t resolve
//     and none of its effects will happen. You won’t draw a card.
//
// `targetLegality` (rule 608.2b): a spell that chose no target resolves; one
// whose every chosen target is illegal doesn't — exactly the ruling.

export default defineCard({
  name: "Scrollshift",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile up to one target artifact, creature, or enchantment you control, then return it to the battlefield under its owner's control.\nDraw a card.",
  targets: [
    {
      kind: "optional",
      of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["artifact", "creature", "enchantment"] } },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "flicker", target: 0 },
      { kind: "draw", amount: 1 },
    ],
  },
});
