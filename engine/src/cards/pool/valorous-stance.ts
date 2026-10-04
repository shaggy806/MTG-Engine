import { defineCard } from "../define.js";

// EDHREC rank 2633.

const SAVE_TEXT = "Target creature gains indestructible until end of turn.";
const KILL_TEXT = "Destroy target creature with toughness 4 or greater.";

export default defineCard({
  name: "Valorous Stance",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    `• ${SAVE_TEXT} (Damage and effects that say "destroy" don't destroy it.)\n` +
    `• ${KILL_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: SAVE_TEXT,
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      },
      {
        text: KILL_TEXT,
        targets: [{ kind: "permanent", filter: { type: "creature", toughness: { op: "gte", n: 4 } } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
