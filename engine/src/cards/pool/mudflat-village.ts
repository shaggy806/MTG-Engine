import { defineCard } from "../define.js";

// EDHREC rank 2929.

export default defineCard({
  name: "Mudflat Village",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add {B}. Spend this mana only to cast a creature spell.\n{1}{B}, {T}, Sacrifice this land: Return target Bat, Lizard, Rat, or Squirrel card from your graveyard to your hand.",
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
        mana: "B",
        amount: 1,
        spendOnly: { spell: { type: "creature" }, text: "Spend this mana only to cast a creature spell." },
      },
      resolve: null,
      text: "{T}: Add {B}. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: "{1}{B}", tap: true, sacrifice: "self" },
      targets: [
        { kind: "card-in-graveyard", whose: "you", filter: { subtypes: ["Bat", "Lizard", "Rat", "Squirrel"] } },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{B}, {T}, Sacrifice this land: Return target Bat, Lizard, Rat, or Squirrel card from your graveyard to your hand.",
    },
  ],
});
