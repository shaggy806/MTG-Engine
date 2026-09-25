import { defineCard } from "../define.js";

export default defineCard({
  name: "Eidolon of Inspiration",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: "At the beginning of combat on your turn, target creature you control gets +2/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "At the beginning of combat on your turn, target creature you control gets +2/+0 until end of turn.",
    },
  ],
});
