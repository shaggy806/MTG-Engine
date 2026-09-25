import { defineCard } from "../define.js";

export default defineCard({
  name: "Krark-Clan Stoker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{T}, Sacrifice an artifact: Add {R}{R}.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice an artifact: Add {R}{R}.",
    },
  ],
});
