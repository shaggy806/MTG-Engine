import { defineCard } from "../define.js";

// EDHREC rank 5545.
//
// "Each of one or two targets": a required slot and an optional second that
// must be a different target (rule 601.2c — Archenemy's Charm's shape),
// each dealt 1 damage (Drakuseth's per-slot damage).

export default defineCard({
  name: "Prismari Charm",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: "Choose one —\n• Surveil 2, then draw a card.\n• Prismari Charm deals 1 damage to each of one or two targets.\n• Return target nonland permanent to its owner's hand.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Surveil 2, then draw a card.",
        targets: [],
        effect: { kind: "surveil", amount: 2, then: { kind: "draw", amount: 1 } },
      },
      {
        text: "Prismari Charm deals 1 damage to each of one or two targets.",
        targets: ["any-target", { kind: "optional", of: { kind: "other", of: "any-target", than: { slot: 0 } } }],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "damage", amount: 1, target: 0 },
            { kind: "damage", amount: 1, target: 1 },
          ],
        },
      },
      {
        text: "Return target nonland permanent to its owner's hand.",
        targets: ["nonland-permanent"],
        effect: { kind: "return-to-hand", target: 0 },
      },
    ],
  },
});
