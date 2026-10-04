import { defineCard } from "../define.js";

// EDHREC rank 6279.
//
// Rulings:
//   [2022-10-07] Use the mana value of the card as it last existed in the graveyard to determine
//     the amount of life you gain.

export default defineCard({
  name: "Sister Hospitaller",
  manaCost: "{4}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 2,
  text: "Medicus Ministorum — When this creature enters, return target creature card from your graveyard to the battlefield. You gain life equal to its mana value.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      // Phyrexian Delver's shape; `manaValueOf` reads the card as it last existed (the ruling).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "gain-life", amount: { manaValueOf: 0 } },
        ],
      },
      resolve: null,
      text: "Medicus Ministorum — When this creature enters, return target creature card from your graveyard to the battlefield. You gain life equal to its mana value.",
    },
  ],
});
