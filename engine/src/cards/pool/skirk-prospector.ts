import { defineCard } from "../define.js";

export default defineCard({
  name: "Skirk Prospector",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a Goblin: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "Sacrifice a Goblin: Add {R}.",
    },
  ],
});
