import { defineCard } from "../define.js";

export default defineCard({
  name: "Aven Archer",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Soldier", "Archer"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{2}{W}, {T}: This creature deals 2 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{2}{W}, {T}: This creature deals 2 damage to target attacking or blocking creature.",
    },
  ],
});
