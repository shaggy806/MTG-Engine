import { defineCard } from "../define.js";

// EDHREC rank 3673.
//
// Rulings:
//   [2011-09-22] Untapping an attacking creature doesn't remove it from combat.
const ENTER_TEXT = "When this creature enters, untap all creatures you control.";

export default defineCard({
  name: "Village Bell-Ringer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 4,
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
