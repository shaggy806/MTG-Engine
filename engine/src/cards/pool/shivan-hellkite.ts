import { defineCard } from "../define.js";

export default defineCard({
  name: "Shivan Hellkite",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\n{1}{R}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}{R}: This creature deals 1 damage to any target.",
    },
  ],
});
