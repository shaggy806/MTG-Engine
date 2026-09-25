import { defineCard } from "../define.js";

export default defineCard({
  name: "Grabby Giant",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 4,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\n{2}{R}, Sacrifice an artifact or land: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{2}{R}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "land"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{R}, Sacrifice an artifact or land: Draw a card.",
    },
  ],
  faces: ["Grabby Giant", "That's Mine"],
  adventure: true,
});
