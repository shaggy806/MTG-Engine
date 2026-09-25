import { defineCard } from "../define.js";

export default defineCard({
  name: "Reinforced Ronin",
  manaCost: "{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Samurai"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nAt the beginning of your end step, return this creature to its owner's hand.\nChannel — {1}{R}, Discard this card: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Channel — {1}{R}, Discard this card: Draw a card.",
      zone: "hand",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "At the beginning of your end step, return this creature to its owner's hand.",
    },
  ],
});
