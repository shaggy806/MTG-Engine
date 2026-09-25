import { defineCard } from "../define.js";

export default defineCard({
  name: "Raphael, Tough Turtle",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Turtle"],
  power: 1,
  toughness: 3,
  text: "Alliance — Whenever another creature you control enters, Raphael deals 1 damage to target opponent.",
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
      text: "Alliance — Whenever another creature you control enters, Raphael deals 1 damage to target opponent.",
    },
  ],
});
