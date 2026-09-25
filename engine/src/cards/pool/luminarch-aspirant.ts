import { defineCard } from "../define.js";

export default defineCard({
  name: "Luminarch Aspirant",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control.",
    },
  ],
});
