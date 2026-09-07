import { defineCard } from "../define.js";

/**
 * The reference flashback card — ROADMAP Phase 6. Cast from hand for `{R}`, or
 * later from the graveyard for its flashback cost `{1}{R}`; a spell cast via
 * flashback is exiled instead of returning to the graveyard (rule 702.34).
 */
export default defineCard({
  name: "Faithless Looting",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Draw two cards, then discard two cards.\nFlashback {1}{R}",
  flashback: { cost: "{1}{R}" },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "discard", target: "you", amount: 2 },
    ],
  },
});
