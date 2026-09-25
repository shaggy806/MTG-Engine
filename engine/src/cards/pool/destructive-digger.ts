import { defineCard } from "../define.js";

export default defineCard({
  name: "Destructive Digger",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 3,
  toughness: 2,
  text: "{3}, {T}, Sacrifice an artifact or land: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}", tap: true, sacrifice: { filter: { typesAnyOf: ["artifact", "land"] } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, {T}, Sacrifice an artifact or land: Draw a card.",
    },
  ],
});
