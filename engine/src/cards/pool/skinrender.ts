import { defineCard } from "../define.js";

// EDHREC rank 5715.
//
// Rulings:
//   [2011-01-01] This ability is mandatory. If there are no other creatures on the battlefield,
//     you must target Skinrender itself.

export default defineCard({
  name: "Skinrender",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Zombie"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, put three -1/-1 counters on target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 3 },
      resolve: null,
      text: "When this creature enters, put three -1/-1 counters on target creature.",
    },
  ],
});
