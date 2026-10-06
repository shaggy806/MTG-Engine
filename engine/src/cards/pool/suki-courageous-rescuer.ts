import { defineCard } from "../define.js";

// EDHREC rank 6595.
//
// "During your turn" is part of the trigger condition (rule 603.1 — Oni-Cult Anvil's
// `whileCondition`), so a permanent leaving on an opponent's turn neither triggers it nor uses up
// its once.
const ANTHEM_TEXT = "Other creatures you control get +1/+0.";
const LEAVE_TEXT =
  "Whenever another permanent you control leaves the battlefield during your turn, create a 1/1 white Ally creature token. This ability triggers only once each turn.";

export default defineCard({
  name: "Suki, Courageous Rescuer",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 2,
  toughness: 4,
  text: `${ANTHEM_TEXT}\n${LEAVE_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 0],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "you-control", otherOnly: true },
      whileCondition: { kind: "your-turn" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
