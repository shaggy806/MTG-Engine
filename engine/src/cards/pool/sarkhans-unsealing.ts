import { defineCard } from "../define.js";

// EDHREC rank 6210.
//
// Rulings:
//   [2018-07-13] Sarkhan's Unsealing checks the spell's power only as you finish paying costs.
//   [2018-07-13] Each of the triggered abilities resolves before the spell that caused it to
//     trigger, even if that spell is countered.
//   [2018-07-13] +1/+1 counters the creature will enter with, and effects that raise its power
//     once it's on the battlefield, aren't considered.
//
// Gwenna, Eyes of Gaea's "creature spell with power N or greater" cast
// trigger; "4, 5, or 6" is power ≥ 4 and (one-clause `anyOf`) ≤ 6. The
// second is End the Festivities' damage.
const SMALL_TEXT = "Whenever you cast a creature spell with power 4, 5, or 6, this enchantment deals 4 damage to any target.";
const BIG_TEXT =
  "Whenever you cast a creature spell with power 7 or greater, this enchantment deals 4 damage to each opponent and each creature and planeswalker they control.";

export default defineCard({
  name: "Sarkhan's Unsealing",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${SMALL_TEXT}\n${BIG_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { type: "creature", power: { op: "gte", n: 4 }, anyOf: [{ power: { op: "lte", n: 6 } }] },
      },
      targets: ["any-target"],
      effect: { kind: "damage", target: 0, amount: 4 },
      resolve: null,
      text: SMALL_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature", power: { op: "gte", n: 7 } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 4, who: "each-opponent" },
          {
            kind: "damage-all",
            filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "opponent" },
            amount: 4,
          },
        ],
      },
      resolve: null,
      text: BIG_TEXT,
    },
  ],
});
