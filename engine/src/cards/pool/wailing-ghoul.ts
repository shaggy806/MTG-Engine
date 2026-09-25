import { defineCard } from "../define.js";

export default defineCard({
  name: "Wailing Ghoul",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 3,
  text: "When this creature enters, mill two cards. (Put the top two cards of your library into your graveyard.)",
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
