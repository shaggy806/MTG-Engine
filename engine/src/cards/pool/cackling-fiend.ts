import { defineCard } from "../define.js";

export default defineCard({
  name: "Cackling Fiend",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, each opponent discards a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "When this creature enters, each opponent discards a card.",
    },
  ],
});
