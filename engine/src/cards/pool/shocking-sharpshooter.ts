import { defineCard } from "../define.js";

export default defineCard({
  name: "Shocking Sharpshooter",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Archer"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\nWhenever another creature you control enters, this creature deals 1 damage to target opponent.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever another creature you control enters, this creature deals 1 damage to target opponent.",
    },
  ],
});
