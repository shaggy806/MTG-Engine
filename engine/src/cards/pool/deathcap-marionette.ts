import { defineCard } from "../define.js";

export default defineCard({
  name: "Deathcap Marionette",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhen this creature enters, you may mill two cards. (You may put the top two cards of your library into your graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Mill two cards?",
        effect: { kind: "mill", target: "you", amount: 2 },
      },
      resolve: null,
      text: "When this creature enters, you may mill two cards.",
    },
  ],
});
