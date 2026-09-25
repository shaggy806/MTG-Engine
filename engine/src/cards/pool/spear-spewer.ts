import { defineCard } from "../define.js";

export default defineCard({
  name: "Spear Spewer",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text: "Defender\n{T}: This creature deals 1 damage to each player.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-player" },
      resolve: null,
      text: "{T}: This creature deals 1 damage to each player.",
    },
  ],
});
