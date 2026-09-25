import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunshot Militia",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 3,
  text: "Tap two untapped artifacts and/or creatures you control: This creature deals 1 damage to each opponent. Activate only as a sorcery.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 2,
          filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Tap two untapped artifacts and/or creatures you control: This creature deals 1 damage to each opponent. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
