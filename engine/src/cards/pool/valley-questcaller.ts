import { defineCard } from "../define.js";

// EDHREC rank 5158.
//
// Rulings:
//   [2024-07-26] If Valley Questcaller enters at the same time as one or more other Rabbits, Bats,
//     Birds, and/or Mice you control, its first ability will trigger.

// "One or more … enter" is a batched entry trigger (once per simultaneous
// entry); `otherOnly` drops only this creature's own entry from the batch, so
// the ruling's case still fires on the others.
const KIN = ["Rabbit", "Bat", "Bird", "Mouse"] as const;
const ENTER_TEXT = "Whenever one or more other Rabbits, Bats, Birds, and/or Mice you control enter, scry 1.";
const ANTHEM_TEXT = "Other Rabbits, Bats, Birds, and Mice you control get +1/+1.";

export default defineCard({
  name: "Valley Questcaller",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Warrior"],
  power: 2,
  toughness: 3,
  text: `${ENTER_TEXT}\n${ANTHEM_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtypes: KIN },
        otherOnly: true,
        batched: true,
      },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtypes: KIN, controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
