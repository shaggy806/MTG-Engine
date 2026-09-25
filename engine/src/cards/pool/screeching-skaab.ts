import { defineCard } from "../define.js";

export default defineCard({
  name: "Screeching Skaab",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, mill two cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 2 },
      resolve: null,
      text: "When this creature enters, mill two cards.",
    },
  ],
});
