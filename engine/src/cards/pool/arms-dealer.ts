import { defineCard } from "../define.js";

export default defineCard({
  name: "Arms Dealer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 1,
  toughness: 1,
  text: "{1}{R}, Sacrifice a Goblin: This creature deals 4 damage to target creature.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["creature"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      text: "{1}{R}, Sacrifice a Goblin: This creature deals 4 damage to target creature.",
    },
  ],
});
