import { defineCard } from "../define.js";

export default defineCard({
  name: "Ramunap Ruins",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{T}, Pay 1 life: Add {R}.\n{2}{R}{R}, {T}, Sacrifice a Desert: This land deals 2 damage to each opponent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {R}.",
    },
    {
      cost: { mana: "{2}{R}{R}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "{2}{R}{R}, {T}, Sacrifice a Desert: This land deals 2 damage to each opponent.",
    },
  ],
});
