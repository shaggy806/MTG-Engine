import { defineCard } from "../define.js";

export default defineCard({
  name: "Storm Spirit",
  manaCost: "{3}{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["creature"],
  subtypes: ["Elemental", "Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{T}: This creature deals 2 damage to target creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 2 damage to target creature.",
    },
  ],
});
