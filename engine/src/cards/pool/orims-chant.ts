import { defineCard } from "../define.js";

const CANT_CAST = { kind: "prohibit", who: 0, spells: true } as const;

// Kicked, the rule reaches every creature this turn, one that arrives later
// included (a turn-wide `restrict`).
export default defineCard({
  name: "Orim's Chant",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Kicker {W} (You may pay an additional {W} as you cast this spell.)\n" +
    "Target player can't cast spells this turn. If this spell was kicked, creatures can't attack this turn.",
  targets: ["player"],
  effect: CANT_CAST,
  kicker: {
    cost: "{W}",
    targets: ["player"],
    effect: {
      kind: "sequence",
      effects: [CANT_CAST, { kind: "restrict", filter: { type: "creature" }, restrictions: ["cant-attack"] }],
    },
  },
});
