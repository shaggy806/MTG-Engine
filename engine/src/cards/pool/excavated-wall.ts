import { defineCard } from "../define.js";

export default defineCard({
  name: "Excavated Wall",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\n{1}, {T}: Mill a card. (Put the top card of your library into your graveyard.)",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Mill a card.",
    },
  ],
});
