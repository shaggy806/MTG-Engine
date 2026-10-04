import { defineCard } from "../define.js";

// Gwaihir, Greatest of the Eagles's Bird token.

export default defineCard({
  name: "Bird Token (Gwaihir, Greatest of the Eagles)",
  art: "561341f5-3eb1-4f52-8dee-668a60e091be",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, target attacking creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever this creature attacks, target attacking creature gains flying until end of turn.",
    },
  ],
});
