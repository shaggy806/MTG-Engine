import { defineCard } from "../define.js";

// EDHREC rank 4276.
//
// Rulings:
//   [2023-02-04] If the target creature is an illegal target by the time the spell tries to
//     resolve, the spell will not resolve. No token is created, even if X is 5 or more.
//
// The target reads X, which is chosen first (rule 601.2b–c — Stolen by the
// Fae's shape); "if X is 5 or more" is White Sun's Twilight's `x` condition.

const TEXT =
  "Gain control of target creature with mana value X or less. If X is 5 or more, create a token that's a copy of that creature.";

export default defineCard({
  name: "Blue Sun's Twilight",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "permanent", filter: { type: "creature", manaValue: { op: "lte", n: "x" } } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-control", target: 0, untilEndOfTurn: false },
      {
        kind: "conditional",
        condition: { kind: "x", compare: { op: "gte", n: 5 } },
        then: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      },
    ],
  },
});
