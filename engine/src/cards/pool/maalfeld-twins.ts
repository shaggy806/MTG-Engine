import { defineCard } from "../define.js";

export default defineCard({
  name: "Maalfeld Twins",
  manaCost: "{5}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 4,
  toughness: 4,
  text: "When this creature dies, create two 2/2 black Zombie creature tokens.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 2 },
      resolve: null,
      text: "When this creature dies, create two 2/2 black Zombie creature tokens.",
    },
  ],
});
