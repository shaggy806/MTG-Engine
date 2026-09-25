import { defineCard } from "../define.js";

export default defineCard({
  name: "Chasm Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, target creature you control gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever this creature attacks, target creature you control gains flying until end of turn.",
    },
  ],
});
