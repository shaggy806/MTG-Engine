import { defineCard } from "../define.js";

export default defineCard({
  name: "Hornet Harasser",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, target creature gets -2/-2 until end of turn.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature dies, target creature gets -2/-2 until end of turn.",
    },
  ],
});
