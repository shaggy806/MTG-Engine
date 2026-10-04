import { defineCard } from "../define.js";

// EDHREC rank 4839.
//
// Rulings:
//   [2016-04-08] If Thalia’s Lieutenant enters the battlefield at the same time as another Human,
//     each of Thalia’s Lieutenant’s abilities will trigger. You’ll put a +1/+1 counter on both
//     cards.

// "Each other Human you control" is any Human permanent, not only creatures.
const ENTER_TEXT = "When this creature enters, put a +1/+1 counter on each other Human you control.";
const GROW_TEXT = "Whenever another Human you control enters, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Thalia's Lieutenant",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: `${ENTER_TEXT}\n${GROW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Human", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Human" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
