import { defineCard } from "../define.js";

export default defineCard({
  name: "Ahriman",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Eye", "Horror"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch\n{3}, Sacrifice another creature or artifact: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{3}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, Sacrifice another creature or artifact: Draw a card.",
      otherOnly: true,
    },
  ],
});
