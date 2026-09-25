import { defineCard } from "../define.js";

export default defineCard({
  name: "Malakir Familiar",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch\nWhenever you gain life, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you gain life, this creature gets +1/+1 until end of turn.",
    },
  ],
});
