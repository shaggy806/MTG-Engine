import { defineCard } from "../define.js";

// "Sacrifice **another** creature": `otherOnly` keeps the source out of its
// own sacrifice cost (Prossh's shape). No `{T}`, so it can be activated any
// number of times, at instant speed, while summoning sick.
const TEXT = "Pay 1 life, Sacrifice another creature: Create a Treasure token.";

export default defineCard({
  name: "Warren Soultrader",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Goblin", "Wizard"],
  power: 3,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 1, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
