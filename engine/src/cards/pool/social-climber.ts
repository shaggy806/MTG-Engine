import { defineCard } from "../define.js";

export default defineCard({
  name: "Social Climber",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 2,
  text: "Alliance — Whenever another creature you control enters, you gain 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Alliance — Whenever another creature you control enters, you gain 1 life.",
    },
  ],
});
