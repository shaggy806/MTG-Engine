import { defineCard } from "../define.js";

export default defineCard({
  name: "Intruding Soulrager",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\n{T}, Sacrifice a Room: This creature deals 2 damage to each opponent. Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Room" } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "damage", amount: 2, who: "each-opponent" }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "{T}, Sacrifice a Room: This creature deals 2 damage to each opponent. Draw a card.",
    },
  ],
});
