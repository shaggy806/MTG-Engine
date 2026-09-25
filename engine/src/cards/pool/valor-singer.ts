import { defineCard } from "../define.js";

export default defineCard({
  name: "Valor Singer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Tiefling", "Bard"],
  power: 2,
  toughness: 3,
  text: "Combat Inspiration — At the beginning of combat on your turn, target creature you control gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Combat Inspiration — At the beginning of combat on your turn, target creature you control gets +1/+0 until end of turn.",
    },
  ],
});
