import { defineCard } from "../define.js";

export default defineCard({
  name: "Thraxodemon",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 2,
  toughness: 2,
  text: "{3}, {T}, Sacrifice another creature or artifact: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{3}",
        tap: true,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, {T}, Sacrifice another creature or artifact: Draw a card.",
      otherOnly: true,
    },
  ],
});
