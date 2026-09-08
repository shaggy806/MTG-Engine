import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-2 — a made-up "charm": a targeted modal spell. Its modes
 * are chosen as it's cast (rule 700.2 / 601.2b), then targets for those modes.
 */
export default defineCard({
  name: "Sunder Charm",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  types: ["instant"],
  text: "Choose one —\n• Sunder Charm deals 3 damage to target creature.\n• Return target permanent to its owner's hand.\n• You draw a card.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Sunder Charm deals 3 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 3, target: 0 },
      },
      {
        text: "Return target permanent to its owner's hand.",
        targets: ["permanent"],
        effect: { kind: "return-to-hand", target: 0 },
      },
      {
        text: "You draw a card.",
        effect: { kind: "draw", amount: 1 },
      },
    ],
  },
});
