import { defineCard } from "../define.js";

export default defineCard({
  name: "Mineshaft Spider",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 3,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach\nWhen this creature enters, you may mill two cards. (You may put the top two cards of your library into your graveyard.)",
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
