import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Mastery",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "Zombies you control get +1/+1.\n" +
    "When Liliana's Mastery enters, create two 2/2 black Zombie creature tokens.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie" },
      grantPt: [1, 1],
      text: "Zombies you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 2 },
      resolve: null,
      text: "When Liliana's Mastery enters, create two 2/2 black Zombie creature tokens.",
    },
  ],
});
