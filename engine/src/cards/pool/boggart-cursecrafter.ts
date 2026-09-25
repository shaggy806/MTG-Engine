import { defineCard } from "../define.js";

export default defineCard({
  name: "Boggart Cursecrafter",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warlock"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhenever another Goblin you control dies, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Goblin" }, otherOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another Goblin you control dies, this creature deals 1 damage to each opponent.",
    },
  ],
});
