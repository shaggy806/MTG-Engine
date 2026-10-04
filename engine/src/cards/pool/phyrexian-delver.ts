import { defineCard } from "../define.js";

// EDHREC rank 3997.

export default defineCard({
  name: "Phyrexian Delver",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Zombie"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, return target creature card from your graveyard to the battlefield. You lose life equal to that card's mana value.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "lose-life", amount: { manaValueOf: 0 } },
        ],
      },
      resolve: null,
      text: "When this creature enters, return target creature card from your graveyard to the battlefield. You lose life equal to that card's mana value.",
    },
  ],
});
