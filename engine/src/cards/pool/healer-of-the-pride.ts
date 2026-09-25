import { defineCard } from "../define.js";

export default defineCard({
  name: "Healer of the Pride",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Cleric"],
  power: 2,
  toughness: 3,
  text: "Whenever another creature you control enters, you gain 2 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 2 life.",
    },
  ],
});
