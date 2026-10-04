import { defineCard } from "../define.js";

// EDHREC rank 3401.
//
// Rulings:
//   [2017-07-14] If this creature's power is negative as its ability resolves, X is considered to
//     be 0.
//   [2025-02-07] If the greatest power among creatures you control is negative as this creature’s
//     ability resolves, X is considered to be 0.

const YOURS = { type: "creature", controlledBy: "you" } as const;
const TEXT =
  "Whenever this creature attacks, creatures you control gain trample and get +X/+X until end of turn, where X is the greatest power among creatures you control.";

// Overwhelming Stampede's effect on an attack trigger. X is read once, as
// the pump applies (an aggregate amount is clamped at 0 — the rulings); the
// trample grant before it moves no creature's power.
export default defineCard({
  name: "Pathbreaker Ibex",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Goat"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: YOURS, keyword: "trample", duration: "end-of-turn" },
          {
            kind: "modify-pt-all",
            filter: YOURS,
            power: { aggregate: "max", of: "power", filter: YOURS },
            toughness: { aggregate: "max", of: "power", filter: YOURS },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
