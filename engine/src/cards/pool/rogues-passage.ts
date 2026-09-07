import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 7 — an evasion grant. The "can't be blocked" ability is just a
 * `grant-keyword` of the existing `unblockable` keyword until end of turn — no
 * new engine vocab.
 */
export default defineCard({
  name: "Rogue's Passage",
  types: ["land"],
  text: "{T}: Add {C}.\n{5}, {T}: Target creature can't be blocked this turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "{5}, {T}: Target creature can't be blocked this turn.",
    },
  ],
});
