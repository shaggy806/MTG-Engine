import { defineCard } from "../define.js";

export default defineCard({
  name: "Desperate Bloodseeker",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\nWhen this creature enters, target player mills two cards. (They put the top two cards of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "When this creature enters, target player mills two cards.",
    },
  ],
});
