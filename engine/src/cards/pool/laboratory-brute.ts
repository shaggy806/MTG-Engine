import { defineCard } from "../define.js";

export default defineCard({
  name: "Laboratory Brute",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, mill four cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: "When this creature enters, mill four cards.",
    },
  ],
});
