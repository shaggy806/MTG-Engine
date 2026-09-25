import { defineCard } from "../define.js";

export default defineCard({
  name: "Noxious Toad",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, each opponent discards a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "When this creature dies, each opponent discards a card.",
    },
  ],
});
