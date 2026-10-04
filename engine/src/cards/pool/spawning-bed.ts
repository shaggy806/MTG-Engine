import { defineCard } from "../define.js";

// EDHREC rank 4681.
// Makes Eldrazi Scion → use "Eldrazi Scion Token".
//
// Rulings:
//   [2015-08-25] Some instants and sorceries that create Eldrazi Scions require targets. If all
//     targets for such a spell have become illegal by the time that spell tries to resolve, the
//     spell won't resolve and none of its effects will happen. You won't get any Eldrazi Scions.
//   [2015-08-25] Eldrazi and Scion are each separate creature types. Anything that affects Eldrazi
//     will affect these tokens, for example.
//   [2015-08-25] Eldrazi Scions are similar to Eldrazi Spawn, seen in the Zendikar block. Note
//     that Eldrazi Scions are 1/1, not 0/1.
//   [2015-08-25] Sacrificing an Eldrazi Scion creature token to add {C} is a mana ability. It
//     doesn't use the stack and can't be responded to.

export default defineCard({
  name: "Spawning Bed",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{6}, {T}, Sacrifice this land: Create three 1/1 colorless Eldrazi Scion creature tokens. They have \"Sacrifice this token: Add {C}.\"",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{6}", tap: true, sacrifice: "self" },
      targets: [],
      // "Eldrazi Scion Token" carries its own "Sacrifice this token: Add {C}."
      effect: { kind: "create-token", token: "Eldrazi Scion Token", count: 3 },
      resolve: null,
      text: "{6}, {T}, Sacrifice this land: Create three 1/1 colorless Eldrazi Scion creature tokens. They have \"Sacrifice this token: Add {C}.\"",
    },
  ],
});
