import { defineCard } from "../define.js";

export default defineCard({
  name: "Doomed Dissenter",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 2/2 black Zombie creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 2/2 black Zombie creature token.",
    },
  ],
});
