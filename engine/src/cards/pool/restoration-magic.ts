import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 1105. Tiered (rule 702.183a) — Thunder Magic's shape.
const CURE = "• Cure — {0} — Target permanent gains hexproof and indestructible until end of turn.";
const CURA = "• Cura — {1} — Target permanent gains hexproof and indestructible until end of turn. You gain 3 life.";
const CURAGA = "• Curaga — {3}{W} — Permanents you control gain hexproof and indestructible until end of turn. You gain 6 life.";

const protect: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
    { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
  ],
};

export default defineCard({
  name: "Restoration Magic",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Tiered (Choose one additional cost.)\n${CURE}\n${CURA}\n${CURAGA}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: CURE, spreeCost: "{0}", targets: ["permanent"], effect: protect },
      {
        text: CURA,
        spreeCost: "{1}",
        targets: ["permanent"],
        effect: { kind: "sequence", effects: [protect, { kind: "gain-life", amount: 3 }] },
      },
      {
        text: CURAGA,
        spreeCost: "{3}{W}",
        targets: [],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword-all", filter: { controlledBy: "you" }, keyword: "hexproof", duration: "end-of-turn" },
            { kind: "grant-keyword-all", filter: { controlledBy: "you" }, keyword: "indestructible", duration: "end-of-turn" },
            { kind: "gain-life", amount: 6 },
          ],
        },
      },
    ],
  },
});
