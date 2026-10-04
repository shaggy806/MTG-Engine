import { defineCard } from "../define.js";

// EDHREC rank 2637.
//
// Rulings:
//   [2025-04-04] You don't have to choose a target for Heritage Reclamation if you choose its
//     third mode. However, if you do, and that target is illegal at the time Heritage Reclamation
//     tries to resolve, it won't resolve and none of its effects will happen. You won't draw a
//     card.
// Return to Nature's shape. The third mode's slot is optional: chosen and
// illegal, the spell doesn't resolve (rule 608.2b); left empty, it still draws.
export default defineCard({
  name: "Heritage Reclamation",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Destroy target artifact.\n" +
    "• Destroy target enchantment.\n" +
    "• Exile up to one target card from a graveyard. Draw a card.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Exile up to one target card from a graveyard. Draw a card.",
        targets: [{ kind: "optional", of: { kind: "card-in-graveyard" } }],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: 0 },
            { kind: "draw", amount: 1 },
          ],
        },
      },
    ],
  },
});
