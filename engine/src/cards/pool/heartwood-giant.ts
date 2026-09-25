import { defineCard } from "../define.js";

export default defineCard({
  name: "Heartwood Giant",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 4,
  toughness: 4,
  text: "{T}, Sacrifice a Forest: This creature deals 2 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Forest" } } },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a Forest: This creature deals 2 damage to target player or planeswalker.",
    },
  ],
});
