import { defineCard } from "../define.js";

export default defineCard({
  name: "Sacellum Archers",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 3,
  text: "{R}{W}, {T}: This creature deals 2 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: "{R}{W}", tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}{W}, {T}: This creature deals 2 damage to target attacking or blocking creature.",
    },
  ],
});
