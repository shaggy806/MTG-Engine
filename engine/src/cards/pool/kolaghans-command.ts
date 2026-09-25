import { defineCard } from "../define.js";

export default defineCard({
  name: "Kolaghan's Command",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text:
    "Choose two —\n" +
    "• Return target creature card from your graveyard to your hand.\n" +
    "• Target player discards a card.\n" +
    "• Destroy target artifact.\n" +
    "• Kolaghan's Command deals 2 damage to any target.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Return target creature card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Target player discards a card.",
        targets: ["player"],
        effect: { kind: "discard", target: 0, amount: 1 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Kolaghan's Command deals 2 damage to any target.",
        targets: ["any-target"],
        effect: { kind: "damage", amount: 2, target: 0 },
      },
    ],
  },
});
