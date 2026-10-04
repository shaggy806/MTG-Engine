import { defineCard } from "../define.js";

// EDHREC rank 4938.
//
// Rulings:
//   [2018-04-27] If the damage Goblin Chainwhirler would deal to a player is prevented, it still
//     deals 1 damage to that player’s creatures and planeswalkers.
//
// One instruction, so one simultaneous damage event (`simultaneous`, as
// Pestilence and Delayed Blast Fireball).
const TEXT =
  "When this creature enters, it deals 1 damage to each opponent and each creature and planeswalker they control.";

export default defineCard({
  name: "Goblin Chainwhirler",
  manaCost: "{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: `First strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "damage", amount: 1, who: "each-opponent" },
          {
            kind: "damage-all",
            filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "opponent" },
            amount: 1,
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
