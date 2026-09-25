import { defineCard } from "../define.js";

export default defineCard({
  name: "Scorched Rusalka",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{R}, Sacrifice a creature: This creature deals 1 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "creature-you-control" },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{R}, Sacrifice a creature: This creature deals 1 damage to target player or planeswalker.",
    },
  ],
});
