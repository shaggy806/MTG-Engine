import { defineCard } from "../define.js";

// Two of the three modes target, so the mode is chosen at cast time
// (`castModal`, AUTHORING §6) rather than by a resolution-time `modal`.
export default defineCard({
  name: "Boros Charm",
  manaCost: "{R}{W}",
  colors: ["R", "W"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Boros Charm deals 4 damage to target player or planeswalker.\n" +
    "• Permanents you control gain indestructible until end of turn.\n" +
    "• Target creature gains double strike until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Boros Charm deals 4 damage to target player or planeswalker.",
        // Any player, yourself included — not the opponent-only wording.
        targets: ["player-or-planeswalker"],
        effect: { kind: "damage", amount: 4, target: 0 },
      },
      {
        text: "Permanents you control gain indestructible until end of turn.",
        // Only what you control as it resolves (the 2024-11-08 ruling): the
        // grant lands on each matching permanent then, not on later arrivals.
        effect: {
          kind: "grant-keyword-all",
          filter: { controlledBy: "you" },
          keyword: "indestructible",
          duration: "end-of-turn",
        },
      },
      {
        text: "Target creature gains double strike until end of turn.",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      },
    ],
  },
});
