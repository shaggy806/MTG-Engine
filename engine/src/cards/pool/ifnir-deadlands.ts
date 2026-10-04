import { defineCard } from "../define.js";

// EDHREC rank 4460.
//
// Rulings:
//   [2017-07-14] If a Desert has an ability with a cost of “Sacrifice a Desert,” you can sacrifice
//     that Desert to pay the cost for its own ability.

export default defineCard({
  name: "Ifnir Deadlands",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{T}, Pay 1 life: Add {B}.\n{2}{B}{B}, {T}, Sacrifice a Desert: Put two -1/-1 counters on target creature an opponent controls. Activate only as a sorcery.",
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
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {B}.",
    },
    {
      cost: { mana: "{2}{B}{B}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 2 },
      resolve: null,
      text: "{2}{B}{B}, {T}, Sacrifice a Desert: Put two -1/-1 counters on target creature an opponent controls. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
