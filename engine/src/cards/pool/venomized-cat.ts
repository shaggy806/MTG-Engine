import { defineCard } from "../define.js";

export default defineCard({
  name: "Venomized Cat",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Symbiote", "Cat", "Villain"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhen this creature enters, mill two cards. (Put the top two cards of your library into your graveyard.)",
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
