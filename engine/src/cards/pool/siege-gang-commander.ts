import { defineCard } from "../define.js";

export default defineCard({
  name: "Siege-Gang Commander",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, create three 1/1 red Goblin creature tokens.\n{1}{R}, Sacrifice a Goblin: This creature deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{1}{R}, Sacrifice a Goblin: This creature deals 2 damage to any target.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 3 },
      resolve: null,
      text: "When this creature enters, create three 1/1 red Goblin creature tokens.",
    },
  ],
});
