import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Devotee",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 3,
  text:
    "Zombies you control get +1/+0.\n" +
    "At the beginning of your end step, if a creature died this turn, you may pay {1}{B}. If you do, create a 2/2 black Zombie creature token.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie" },
      grantPt: [1, 0],
      text: "Zombies you control get +1/+0.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      // "if a creature died this turn" is an intervening-if (603.4).
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{B} to create a 2/2 Zombie?",
        cost: "{1}{B}",
        effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      },
      resolve: null,
      text: "At the beginning of your end step, if a creature died this turn, you may pay {1}{B}. If you do, create a 2/2 black Zombie creature token.",
    },
  ],
});
