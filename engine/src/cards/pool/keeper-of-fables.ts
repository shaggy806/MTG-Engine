import { defineCard } from "../define.js";

// EDHREC rank 3217.
//
// Rulings:
//   [2019-10-04] Keeper of Fables's ability triggers even if it's dealt lethal damage at the same
//     time that non-Humans you control deal combat damage to a player.
//   [2019-10-04] If non-Human creatures you control deal combat damage to two or more players at
//     the same time, Keeper of Fables's ability triggers for each of those players.
//   [2019-10-04] Because creatures with first strike deal combat damage before creatures without
//     first strike, Keeper of Fables's ability can trigger twice during one combat if your
//     creatures deal combat damage to one player at different times.
//
// A batched combat-damage trigger: once per player dealt damage in each
// combat damage step (first-strike and regular damage are two events).
const TEXT = "Whenever one or more non-Human creatures you control deal combat damage to a player, draw a card.";

export default defineCard({
  name: "Keeper of Fables",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 4,
  toughness: 5,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature", notSubtypes: ["Human"] },
        to: "player",
        combat: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
