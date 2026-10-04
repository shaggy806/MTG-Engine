import { defineCard } from "../define.js";

// EDHREC rank 4373.
//
// Rulings:
//   [2020-06-23] Pridemalkin's second ability applies to Pridemalkin as long as it has a +1/+1
//     counter on it.
//   [2020-06-23] Pridemalkin can be the target of its own first ability.

const ENTER_TEXT = "When this creature enters, put a +1/+1 counter on target creature you control.";
const TRAMPLE_TEXT = "Each creature you control with a +1/+1 counter on it has trample.";

export default defineCard({
  name: "Pridemalkin",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 1,
  text: `${ENTER_TEXT}\n${TRAMPLE_TEXT} (It can deal excess combat damage to the player or planeswalker it's attacking.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      // Duskshell Crawler's shape; it includes Pridemalkin itself (the ruling).
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});
