import { defineCard } from "../define.js";

export default defineCard({
  name: "Psychic Membrane",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nWhenever this creature blocks, you may draw a card.",
  triggered: [
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever this creature blocks, you may draw a card.",
    },
  ],
});
