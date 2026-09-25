import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Bladescout",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Scout"],
  power: 2,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this creature enters, target creature gains first strike until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gains first strike until end of turn.",
    },
  ],
});
