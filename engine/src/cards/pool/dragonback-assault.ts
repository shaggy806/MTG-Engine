import { defineCard } from "../define.js";

// EDHREC rank 5769.
// Makes Dragon → new token "Dragon Token (Dragonback Assault)" (scaffolded).
//
// Rulings:
//   [2025-04-04] Whenever a land you control enters, each landfall ability of the permanents you
//     control will trigger. You can put them on the stack in any order. The last ability you put
//     on the stack will be the first one to resolve. (As a result, you can have those abilities
//     resolve in the order of your choosing.)
//   [2025-04-04] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.
//   [2025-04-04] A landfall ability doesn’t trigger if a permanent already on the battlefield
//     becomes a land.

export default defineCard({
  name: "Dragonback Assault",
  manaCost: "{3}{G}{U}{R}",
  colors: ["U", "R", "G"],
  types: ["enchantment"],
  text: "When this enchantment enters, it deals 3 damage to each creature and each planeswalker.\nLandfall — Whenever a land you control enters, create a 4/4 red Dragon creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage-all", filter: { typesAnyOf: ["creature", "planeswalker"] }, amount: 3 },
      resolve: null,
      text: "When this enchantment enters, it deals 3 damage to each creature and each planeswalker.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token (Dragonback Assault)", count: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, create a 4/4 red Dragon creature token with flying.",
    },
  ],
});
