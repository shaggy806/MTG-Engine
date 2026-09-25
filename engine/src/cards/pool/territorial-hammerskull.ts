import { defineCard } from "../define.js";

export default defineCard({
  name: "Territorial Hammerskull",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 3,
  text: "Whenever this creature attacks, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks, tap target creature an opponent controls.",
    },
  ],
});
