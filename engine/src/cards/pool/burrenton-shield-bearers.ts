import { defineCard } from "../define.js";

export default defineCard({
  name: "Burrenton Shield-Bearers",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature attacks, target creature gets +0/+3 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 0, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever this creature attacks, target creature gets +0/+3 until end of turn.",
    },
  ],
});
