import { defineCard } from "../define.js";

export default defineCard({
  name: "Nightscape Master",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{U}{U}, {T}: Return target creature to its owner's hand.\n{R}{R}, {T}: This creature deals 2 damage to target creature.",
  activated: [
    {
      cost: { mana: "{U}{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{U}{U}, {T}: Return target creature to its owner's hand.",
    },
    {
      cost: { mana: "{R}{R}", tap: true },
      targets: ["creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}{R}, {T}: This creature deals 2 damage to target creature.",
    },
  ],
});
