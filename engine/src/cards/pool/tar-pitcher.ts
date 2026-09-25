import { defineCard } from "../define.js";

export default defineCard({
  name: "Tar Pitcher",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{T}, Sacrifice a Goblin: This creature deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a Goblin: This creature deals 2 damage to any target.",
    },
  ],
});
