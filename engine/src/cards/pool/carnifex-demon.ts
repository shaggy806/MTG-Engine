import { defineCard } from "../define.js";

// EDHREC rank 5020.
//
// Rulings:
//   [2011-01-01] As Carnifex Demon's last ability resolves, you'll put a -1/-1 counter on each
//     creature on the battlefield — including creatures you control — except for that Carnifex
//     Demon.

export default defineCard({
  name: "Carnifex Demon",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nThis creature enters with two -1/-1 counters on it.\n{B}, Remove a -1/-1 counter from this creature: Put a -1/-1 counter on each other creature.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, removeCounter: { kind: "-1/-1", count: 1 } },
      targets: [],
      // Every creature but this one, yours included (the ruling).
      effect: { kind: "add-counter-all", filter: { type: "creature" }, counter: "-1/-1", amount: 1, exceptSource: true },
      resolve: null,
      text: "{B}, Remove a -1/-1 counter from this creature: Put a -1/-1 counter on each other creature.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "-1/-1", amount: 2 } },
      text: "This creature enters with two -1/-1 counters on it.",
    },
  ],
});
