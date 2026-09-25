import { defineCard } from "../define.js";

export default defineCard({
  name: "Skirsdag Cultist",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{R}, {T}, Sacrifice a creature: This creature deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{R}", tap: true, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}, {T}, Sacrifice a creature: This creature deals 2 damage to any target.",
    },
  ],
});
