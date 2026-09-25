import { defineCard } from "../define.js";

export default defineCard({
  name: "Mindeye Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhen this creature dies, target player mills five cards.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 5 },
      resolve: null,
      text: "When this creature dies, target player mills five cards.",
    },
  ],
});
