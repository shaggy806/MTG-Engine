import { defineCard } from "../define.js";

// Spree (rule 702.172a). The third mode's player is a target, so a hexproof
// player can't be chosen; one who has become an illegal target by the time
// it resolves gets no counters, while the other modes' legal targets are
// still destroyed (rule 608.2b — the rulings).
export default defineCard({
  name: "Requisition Raid",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Spree (Choose one or more additional costs.)\n" +
    "+ {1} — Destroy target artifact.\n" +
    "+ {1} — Destroy target enchantment.\n" +
    "+ {1} — Put a +1/+1 counter on each creature target player controls.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "+ {1} — Destroy target artifact.",
        spreeCost: "{1}",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "+ {1} — Destroy target enchantment.",
        spreeCost: "{1}",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "+ {1} — Put a +1/+1 counter on each creature target player controls.",
        spreeCost: "{1}",
        targets: ["player"],
        effect: {
          kind: "add-counter-all",
          filter: { type: "creature", controlledBy: "you" },
          counter: "+1/+1",
          amount: 1,
          controlledByTarget: 0,
        },
      },
    ],
  },
});
