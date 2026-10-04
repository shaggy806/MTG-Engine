import { defineCard } from "../define.js";

// EDHREC rank 4073.
//
// Rulings:
//   [2021-04-16] This ability counts the total amount of life gained without considering any life
//     you lost during that turn. For example, if you lost 3 life and gained 3 life earlier in the
//     turn, you'll gain 2 more life from Blossoming Bogbeast and creatures you control will get
//     +5/+5.

export default defineCard({
  name: "Blossoming Bogbeast",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature attacks, you gain 2 life. Then creatures you control gain trample and get +X/+X until end of turn, where X is the amount of life you gained this turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // X is every life gained this turn, the 2 included, regardless of any lost
      // (the ruling); read once as the pump applies (Craterhoof's shape).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 2 },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "trample",
            duration: "end-of-turn",
          },
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: { turnStat: "life-gained", who: "you" },
            toughness: { turnStat: "life-gained", who: "you" },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks, you gain 2 life. Then creatures you control gain trample and get +X/+X until end of turn, where X is the amount of life you gained this turn.",
    },
  ],
});
