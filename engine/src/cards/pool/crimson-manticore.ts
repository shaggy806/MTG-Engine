import { defineCard } from "../define.js";

export default defineCard({
  name: "Crimson Manticore",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Manticore"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{R}, {T}: This creature deals 1 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: "{R}", tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{R}, {T}: This creature deals 1 damage to target attacking or blocking creature.",
    },
  ],
});
