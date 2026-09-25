import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarblade Scout",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\nWhen this creature enters, mill two cards. (Put the top two cards of your library into your graveyard.)",
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
