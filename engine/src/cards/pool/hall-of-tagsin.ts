import { defineCard } from "../define.js";

// EDHREC rank 6298.
// Makes Powerstone → new token "Powerstone Token".
//
// Rulings:
//   [2022-10-14] You can use the {C} added by a Powerstone token on anything that isn't a
//     nonartifact spell. This includes paying costs to activate abilities of both artifact and
//     nonartifact permanents, paying ward costs, and so on.
//   [2022-10-14] Although all the cards in The Brothers' War that create Powerstone tokens create
//     a tapped Powerstone token, entering the battlefield tapped isn't part of the token's
//     definition.

export default defineCard({
  name: "Hall of Tagsin",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n{4}, {T}: Create a tapped Powerstone token. (It's an artifact with \"{T}: Add {C}. This mana can't be spent to cast a nonartifact spell.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Powerstone Token", count: 1, tapped: true },
      resolve: null,
      text: "{4}, {T}: Create a tapped Powerstone token.",
    },
  ],
});
