import { defineCard } from "../define.js";

// EDHREC rank 6440.
//
// Rulings:
//   [2020-11-10] Biowaste Blob's second ability doesn't trigger if you don't control a commander
//     immediately as your upkeep begins. … If you don't control a commander when the trigger
//     resolves, it won't create a token. These don't have to be the same commander at both
//     times, however, and it doesn't have to be your commander.
//   [2020-11-10] Biowaste Blob's first ability affects itself.
//   [2020-11-10] If Biowaste Blob leaves the battlefield before its triggered ability resolves,
//     the token will still enter the battlefield as a copy of Biowaste Blob, using Biowaste
//     Blob's copiable values from when it was last on the battlefield.
//
// "A commander" is anyone's (the ruling), so no `ownedBy`; the intervening-if
// is checked as it triggers and as it resolves (rule 603.4).
const LORD_TEXT = "Oozes you control get +1/+1.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, if you control a commander, create a token that's a copy of this creature.";

export default defineCard({
  name: "Biowaste Blob",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 0,
  toughness: 0,
  text: `${LORD_TEXT}\n${UPKEEP_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Ooze", controlledBy: "you" } },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { isCommander: true, controlledBy: "you" }, atLeast: 1 },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1, who: "you" },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
