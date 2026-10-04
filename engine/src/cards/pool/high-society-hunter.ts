import { defineCard } from "../define.js";

// EDHREC rank 4413.
//
// Rulings:
//   [2024-11-08] If High-Society Hunter dies at the same time as one or more other nontoken
//     creatures, its last ability will trigger for each of those creatures.

export default defineCard({
  name: "High-Society Hunter",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 5,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, you may sacrifice another creature. If you do, put a +1/+1 counter on this creature.\nWhenever another nontoken creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
        ifDid: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Whenever this creature attacks, you may sacrifice another creature. If you do, put a +1/+1 counter on this creature.",
    },
    {
      trigger: { on: "dies", who: "any", filter: { token: false, type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever another nontoken creature dies, draw a card.",
    },
  ],
});
