import { defineCard } from "../define.js";

export default defineCard({
  name: "Elder Gargaroth",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 6,
  toughness: 6,
  keywords: ["reach", "vigilance", "trample"],
  text: "Reach, vigilance, trample\nWhenever this creature attacks or blocks, choose one —\n• Create a 3/3 green Beast creature token.\n• You gain 3 life.\n• Draw a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Create a 3/3 green Beast creature token.",
            effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
          },
          { text: "You gain 3 life.", effect: { kind: "gain-life", amount: 3 } },
          { text: "Draw a card.", effect: { kind: "draw", amount: 1 } },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks or blocks, choose one —",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Create a 3/3 green Beast creature token.",
            effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
          },
          { text: "You gain 3 life.", effect: { kind: "gain-life", amount: 3 } },
          { text: "Draw a card.", effect: { kind: "draw", amount: 1 } },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks or blocks, choose one —",
    },
  ],
});
