import { defineCard } from "../define.js";

// EDHREC rank 2433.
//
// Rulings:
//   [2011-09-22] Consider only the number of +1/+1 counters on Primordial Hydra when determining
//     if it has trample, not its power and toughness. For example, a Primordial Hydra with six
//     +1/+1 counters on it that's been the target of Titanic Growth (giving it +4/+4) would not
//     have trample.

const ENTERS_TEXT = "This creature enters with X +1/+1 counters on it.";
const UPKEEP_TEXT = "At the beginning of your upkeep, double the number of +1/+1 counters on this creature.";
const TRAMPLE_TEXT = "This creature has trample as long as it has ten or more +1/+1 counters on it.";

export default defineCard({
  name: "Primordial Hydra",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  text: `${ENTERS_TEXT}\n${UPKEEP_TEXT}\n${TRAMPLE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTERS_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 10 } },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "double-counters", target: "source", counter: "+1/+1" },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
