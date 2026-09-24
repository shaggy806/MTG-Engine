import { defineCard } from "../define.js";

// "It deals damage equal to its power": the power Juri died with, counters
// and all (rule 608.2h — the card's own ruling). A power of 0 or less deals
// nothing.
export default defineCard({
  name: "Juri, Master of the Revue",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 1,
  text:
    "Whenever you sacrifice a permanent, put a +1/+1 counter on Juri.\n" +
    "When Juri dies, it deals damage equal to its power to any target.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice a permanent, put a +1/+1 counter on Juri.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { powerOf: "source" }, target: 0 },
      resolve: null,
      text: "When Juri dies, it deals damage equal to its power to any target.",
    },
  ],
});
