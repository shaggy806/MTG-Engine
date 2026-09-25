import { defineCard } from "../define.js";

export default defineCard({
  name: "Necromancer's Assistant",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 1,
  text: "When this creature enters, mill three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When this creature enters, mill three cards.",
    },
  ],
});
