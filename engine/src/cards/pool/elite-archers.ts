import { defineCard } from "../define.js";

export default defineCard({
  name: "Elite Archers",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Archer"],
  power: 3,
  toughness: 3,
  text: "{T}: This creature deals 3 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 3 damage to target attacking or blocking creature.",
    },
  ],
});
