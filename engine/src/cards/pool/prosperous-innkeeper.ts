import { defineCard } from "../define.js";

export default defineCard({
  name: "Prosperous Innkeeper",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Halfling", "Citizen"],
  power: 1,
  toughness: 1,
  text:
    "When Prosperous Innkeeper enters the battlefield, create a Treasure token. " +
    "Whenever another creature you control enters, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When Prosperous Innkeeper enters the battlefield, create a Treasure token.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
  ],
});
