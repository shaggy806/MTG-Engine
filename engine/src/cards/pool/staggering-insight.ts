import { defineCard } from "../define.js";

export default defineCard({
  name: "Staggering Insight",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    'Enchanted creature gets +1/+1 and has lifelink and "Whenever this creature ' +
    'deals combat damage to a player, draw a card."',
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["lifelink"],
      grantsTriggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "draw", amount: 1 },
          resolve: null,
          text:
            "Whenever this creature deals combat damage to a player, draw a card.",
        },
      ],
      text:
        'Enchanted creature gets +1/+1 and has lifelink and "Whenever this creature ' +
        'deals combat damage to a player, draw a card."',
    },
  ],
});
