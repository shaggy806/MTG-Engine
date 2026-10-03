import { defineCard } from "../define.js";

// Escalate (rule 702.120a): {G} more for each mode beyond the first, paid even
// when cast without paying its mana cost (the ruling) — `costPerExtraMode`.
export default defineCard({
  name: "Collective Resistance",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Escalate {G} (Pay this cost for each mode chosen beyond the first.)\nChoose one or more —\n• Destroy target artifact.\n• Destroy target enchantment.\n• Target creature gains hexproof and indestructible until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    costPerExtraMode: "{G}",
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
        text: "Target creature gains hexproof and indestructible until end of turn.",
        targets: ["creature"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
            { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
