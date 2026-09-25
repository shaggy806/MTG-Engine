import { defineCard } from "../define.js";

export default defineCard({
  name: "Keldon Necropolis",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {C}.\n{4}{R}, {T}, Sacrifice a creature: Keldon Necropolis deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}{R}", tap: true, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{4}{R}, {T}, Sacrifice a creature: Keldon Necropolis deals 2 damage to any target.",
    },
  ],
});
