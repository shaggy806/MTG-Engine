import { defineCard } from "../define.js";

// Kicked, the one target becomes any number of them — kicker is announced
// before targets are chosen (rule 601.2b), so the kicked variant is its own
// offer with its own targets, as Tear Asunder's is.
export default defineCard({
  name: "Divine Resilience",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Kicker {2}{W} (You may pay an additional {2}{W} as you cast this spell.)\n" +
    "Target creature you control gains indestructible until end of turn. If this spell was kicked, instead " +
    "any number of target creatures you control gain indestructible until end of turn. (Damage and effects " +
    "that say \"destroy\" don't destroy them.)",
  targets: ["creature-you-control"],
  effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
  kicker: {
    cost: "{2}{W}",
    targets: [{ kind: "any-number", of: "creature-you-control" }],
    effect: {
      kind: "for-each-target",
      from: 0,
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    },
  },
});
