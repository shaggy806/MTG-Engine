import { defineCard } from "../define.js";

// EDHREC rank 5795.
//
// Rulings:
//   [2022-02-18] Count the number of Shrines you control as the reflexive triggered ability
//     resolves to determine how many +1/+1 counters to put on the target Shrine.
//   [2022-02-18] Go-Shintai of Boundless Vigor's reflexive triggered ability may target a Shrine
//     which isn't currently a creature.

const REFLEXIVE_TEXT = "When you do, put a +1/+1 counter on target Shrine for each Shrine you control.";
const TEXT = `At the beginning of your end step, you may pay {1}. ${REFLEXIVE_TEXT}`;

export default defineCard({
  name: "Go-Shintai of Boundless Vigor",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // Terra, Herald of Hope's shape: the reflexive ability targets as it
      // triggers, and counts Shrines as it resolves (the ruling). Any Shrine,
      // creature or not, whoever controls it.
      effect: {
        kind: "may",
        prompt: "Pay {1} to put +1/+1 counters on target Shrine?",
        cost: "{1}",
        effect: {
          kind: "reflexive-trigger",
          targets: [{ kind: "permanent", filter: { subtype: "Shrine" } }],
          effect: {
            kind: "add-counter",
            target: 0,
            counter: "+1/+1",
            amount: { countOf: { subtype: "Shrine", controlledBy: "you" } },
          },
          text: REFLEXIVE_TEXT,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
