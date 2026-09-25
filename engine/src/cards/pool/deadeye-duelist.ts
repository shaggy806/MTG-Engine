import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadeye Duelist",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\n{1}, {T}: This creature deals 1 damage to target opponent.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, {T}: This creature deals 1 damage to target opponent.",
    },
  ],
});
