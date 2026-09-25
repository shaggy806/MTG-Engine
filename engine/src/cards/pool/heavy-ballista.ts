import { defineCard } from "../define.js";

export default defineCard({
  name: "Heavy Ballista",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: "{T}: This creature deals 2 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 2 damage to target attacking or blocking creature.",
    },
  ],
});
