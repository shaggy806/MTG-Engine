import { defineCard } from "../define.js";

export default defineCard({
  name: "Cauldron of Essence",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["artifact"],
  text: "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.\n{1}{B}{G}, {T}, Sacrifice a creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}{B}{G}", tap: true, sacrifice: "creature-you-control" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{1}{B}{G}, {T}, Sacrifice a creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
