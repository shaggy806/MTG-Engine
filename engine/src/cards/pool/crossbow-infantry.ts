import { defineCard } from "../define.js";

export default defineCard({
  name: "Crossbow Infantry",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Archer"],
  power: 1,
  toughness: 1,
  text: "{T}: This creature deals 1 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to target attacking or blocking creature.",
    },
  ],
});
