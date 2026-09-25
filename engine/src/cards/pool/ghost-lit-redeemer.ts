import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghost-Lit Redeemer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{W}, {T}: You gain 2 life.\nChannel — {1}{W}, Discard this card: You gain 4 life.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{W}, {T}: You gain 2 life.",
    },
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "Channel — {1}{W}, Discard this card: You gain 4 life.",
      zone: "hand",
    },
  ],
});
