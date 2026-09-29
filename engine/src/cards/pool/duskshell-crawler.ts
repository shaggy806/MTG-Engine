import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, put a +1/+1 counter on target creature.";
const TRAMPLE_TEXT = "Each creature you control with a +1/+1 counter on it has trample.";

export default defineCard({
  name: "Duskshell Crawler",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 3,
  text: `${ENTER_TEXT}\n${TRAMPLE_TEXT} (It can deal excess combat damage to the player or planeswalker it's attacking.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});
