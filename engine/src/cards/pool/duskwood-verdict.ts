import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-2 — a made-up "choose two" modal spell, to exercise
 * `maxModes: 2` and a multi-slot target list built from the chosen modes.
 */
export default defineCard({
  name: "Duskwood Verdict",
  manaCost: "{1}{G}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text: "Choose two —\n• Put a +1/+1 counter on target creature.\n• Target creature gains vigilance until end of turn.\n• You gain 3 life.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Put a +1/+1 counter on target creature.",
        targets: ["creature"],
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      {
        text: "Target creature gains vigilance until end of turn.",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "vigilance", duration: "end-of-turn" },
      },
      {
        text: "You gain 3 life.",
        effect: { kind: "gain-life", amount: 3 },
      },
    ],
  },
});
