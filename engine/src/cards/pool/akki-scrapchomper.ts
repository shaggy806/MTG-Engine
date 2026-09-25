import { defineCard } from "../define.js";

export default defineCard({
  name: "Akki Scrapchomper",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Goblin"],
  power: 1,
  toughness: 1,
  text: "{1}{R}, {T}, Sacrifice an artifact or land: Draw a card.",
  activated: [
    {
      cost: {
        mana: "{1}{R}",
        tap: true,
        sacrifice: { filter: { typesAnyOf: ["artifact", "land"] } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}{R}, {T}, Sacrifice an artifact or land: Draw a card.",
    },
  ],
});
