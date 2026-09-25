import { defineCard } from "../define.js";

export default defineCard({
  name: "Daggerfang Duo",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat", "Squirrel"],
  power: 3,
  toughness: 2,
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
