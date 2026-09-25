import { defineCard } from "../define.js";

export default defineCard({
  name: "Vedalken Mesmerist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 2,
  toughness: 1,
  text: "Whenever this creature attacks, target creature an opponent controls gets -2/-0 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever this creature attacks, target creature an opponent controls gets -2/-0 until end of turn.",
    },
  ],
});
