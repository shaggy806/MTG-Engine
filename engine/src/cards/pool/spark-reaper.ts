import { defineCard } from "../define.js";

export default defineCard({
  name: "Spark Reaper",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 3,
  text: "{3}, Sacrifice a creature or planeswalker: You gain 1 life and draw a card.",
  activated: [
    {
      cost: {
        mana: "{3}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "you" } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "{3}, Sacrifice a creature or planeswalker: You gain 1 life and draw a card.",
    },
  ],
});
