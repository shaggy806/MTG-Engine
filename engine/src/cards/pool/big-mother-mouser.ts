import { defineCard } from "../define.js";

// EDHREC rank 5034.
// Makes Robot → new token "Robot Token (Big Mother Mouser)" (scaffolded).
//
// Rulings:
//   [2026-01-27] To double the number of +1/+1 counters on a creature, put a number of +1/+1
//     counters on it equal to the number it already has. Other cards that interact with putting
//     counters on it will interact with this effect accordingly.
//   [2026-01-27] If enough -1/-1 counters are put on Big Mother Mouser at the same time to make
//     its toughness 0 or less (or the damage marked on it to be lethal), the number of +1/+1
//     counters on it before it got any -1/-1 counters will be used to determine how many Robot
//     tokens you get. For example, if there are three +1/+1 counters on Big Mother Mouser and it
//     gets four -1/-1 counters, you'll get three Robot tokens. That's because Big Mother Mouser's
//     last ability checks Big Mother Mouser's existence just before it leaves the battlefield, and
//     it still has all those counters on it at that point.

export default defineCard({
  name: "Big Mother Mouser",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 0,
  toughness: 0,
  text: "This creature enters with two +1/+1 counters on it.\nWhenever this creature attacks, double the number of +1/+1 counters on it.\nWhen this creature dies, create a number of 1/1 colorless Robot artifact creature tokens equal to the number of +1/+1 counters on this creature.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "double-counters", target: "source", counter: "+1/+1" },
      resolve: null,
      text: "Whenever this creature attacks, double the number of +1/+1 counters on it.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // Read as it last existed on the battlefield (Arcbound Ravager's
      // `countersOn: "source"`); 704.5q's annihilation happens only on what
      // stays, so -1/-1 counters that killed it haven't removed any (the ruling).
      effect: {
        kind: "create-token",
        token: "Robot Token (Big Mother Mouser)",
        count: { countersOn: "source", counter: "+1/+1" },
      },
      resolve: null,
      text: "When this creature dies, create a number of 1/1 colorless Robot artifact creature tokens equal to the number of +1/+1 counters on this creature.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 2 } },
      text: "This creature enters with two +1/+1 counters on it.",
    },
  ],
});
