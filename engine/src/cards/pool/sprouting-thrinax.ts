import { defineCard } from "../define.js";

export default defineCard({
  name: "Sprouting Thrinax",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 3,
  toughness: 3,
  text: "When this creature dies, create three 1/1 green Saproling creature tokens.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 3 },
      resolve: null,
      text: "When this creature dies, create three 1/1 green Saproling creature tokens.",
    },
  ],
});
