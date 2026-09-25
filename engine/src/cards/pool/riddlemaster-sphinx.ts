import { defineCard } from "../define.js";

export default defineCard({
  name: "Riddlemaster Sphinx",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nWhen this creature enters, you may return target creature an opponent controls to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "may",
        prompt: "Return target creature an opponent controls to its owner's hand?",
        effect: { kind: "return-to-hand", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may return target creature an opponent controls to its owner's hand.",
    },
  ],
});
