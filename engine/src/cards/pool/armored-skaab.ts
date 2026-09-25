import { defineCard } from "../define.js";

export default defineCard({
  name: "Armored Skaab",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 1,
  toughness: 4,
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
