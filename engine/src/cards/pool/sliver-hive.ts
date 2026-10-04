import { defineCard } from "../define.js";

// EDHREC rank 5043.
// Makes Sliver → new token "Sliver Token" (scaffolded).
//
// Rulings:
//   [2014-07-18] Whether you control a Sliver is checked only when you activate the last ability,
//     not as that ability resolves. If you control no Slivers at the time the ability resolves,
//     you’ll still get a Sliver token.

export default defineCard({
  name: "Sliver Hive",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add one mana of any color. Spend this mana only to cast a Sliver spell.\n{5}, {T}: Create a 1/1 colorless Sliver creature token. Activate only if you control a Sliver.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: { subtype: "Sliver" }, text: "Spend this mana only to cast a Sliver spell." },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a Sliver spell.",
    },
    {
      cost: { mana: "{5}", tap: true },
      // Checked only as it's activated (the ruling), which is what `condition` is.
      condition: { kind: "controls", filter: { subtype: "Sliver" }, atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Sliver Token", count: 1 },
      resolve: null,
      text: "{5}, {T}: Create a 1/1 colorless Sliver creature token. Activate only if you control a Sliver.",
    },
  ],
});
