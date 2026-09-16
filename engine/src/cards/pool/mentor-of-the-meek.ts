import { defineCard } from "../define.js";

export default defineCard({
  name: "Mentor of the Meek",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature you control with power 2 or less enters, you may pay {1}. If you do, draw a card.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", power: { op: "lte", n: 2 } },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to draw a card?",
        cost: "{1}",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Whenever another creature you control with power 2 or less enters, you may pay {1}. If you do, draw a card.",
    },
  ],
});
