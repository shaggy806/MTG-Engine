import { defineCard } from "../define.js";

// EDHREC rank 4173.
//
// Rulings:
//   [2022-02-18] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.
//   [2022-02-18] An Aura controlled by an opponent does not cause a creature you control to be
//     modified.
//   [2022-02-18] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.

const TEXT =
  "Whenever this creature attacks, put a +1/+1 counter on target creature you control. Then this creature deals X damage to each opponent, where X is the number of modified creatures you control other than this creature.";

export default defineCard({
  name: "Thundering Raiju",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${TEXT} (Equipment, Auras you control, and counters are modifications.)`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          {
            kind: "damage",
            amount: { countOf: { type: "creature", controlledBy: "you", modified: true }, excludeSelf: true },
            who: "each-opponent",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
