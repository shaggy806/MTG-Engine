import { defineCard } from "../define.js";

// EDHREC rank 5431.

export default defineCard({
  name: "Hall of Oracles",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n{T}: Put a +1/+1 counter on target creature. Activate only as a sorcery and only if you've cast an instant or sorcery spell this turn.",
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
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{T}: Put a +1/+1 counter on target creature. Activate only as a sorcery and only if you've cast an instant or sorcery spell this turn.",
      sorcerySpeed: true,
      condition: { kind: "cast-this-turn", filter: { typesAnyOf: ["instant", "sorcery"] } },
    },
  ],
});
