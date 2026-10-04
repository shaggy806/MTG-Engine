import { defineCard } from "../define.js";

// EDHREC rank 4500.
//
// Rulings:
//   [2023-11-03] Gimli's Reckless Might's formidable ability checks the total power of creatures
//     you control twice: once at the appropriate time to see if the ability will trigger, and
//     again as the ability tries to resolve. If, at that time, the total power of creatures you
//     control is no longer 8 or greater, the ability will have no effect.

const FORMIDABLE_TEXT =
  "Formidable — Whenever you attack, if creatures you control have total power 8 or greater, target attacking creature you control fights up to one target creature you don't control.";

export default defineCard({
  name: "Gimli's Reckless Might",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Creatures you control have haste.\n" + FORMIDABLE_TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      // An intervening-if (rule 603.4): asked again as it resolves (the ruling).
      condition: {
        kind: "aggregate",
        value: { aggregate: "sum", of: "power", filter: { type: "creature", controlledBy: "you" } },
        compare: { op: "gte", n: 8 },
      },
      targets: [
        { kind: "permanent", whose: "you", filter: { type: "creature", attacking: true } },
        { kind: "optional", of: "creature-an-opponent-controls" },
      ],
      // With the second target skipped or gone, nothing fights.
      effect: { kind: "fight", a: 0, b: 1 },
      resolve: null,
      text: FORMIDABLE_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
