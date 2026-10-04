import { defineCard } from "../define.js";

// EDHREC rank 5098.
//
// Rulings:
//   [2024-11-08] Once Skyknight Squire has been blocked, putting enough +1/+1 counters on it to
//     give it flying won't cause it to become unblocked.
//   [2024-11-08] If Skyknight Squire enters at the same time as one or more other creatures you
//     control, its first ability will trigger for each of those other creatures.

const GROW_TEXT = "Whenever another creature you control enters, put a +1/+1 counter on this creature.";
const KNIGHT_TEXT =
  "As long as this creature has three or more +1/+1 counters on it, it has flying and is a Knight in addition to its other types.";

export default defineCard({
  name: "Skyknight Squire",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Scout"],
  power: 1,
  toughness: 1,
  text: `${GROW_TEXT}\n${KNIGHT_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 3 } },
      addSubtypes: ["Knight"],
      grantKeywords: ["flying"],
      text: KNIGHT_TEXT,
    },
  ],
});
