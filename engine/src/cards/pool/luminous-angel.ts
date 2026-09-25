import { defineCard } from "../define.js";

export default defineCard({
  name: "Luminous Angel",
  manaCost: "{4}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, you may create a 1/1 white Spirit creature token with flying.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 white Spirit creature token with flying?",
        effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may create a 1/1 white Spirit creature token with flying.",
    },
  ],
});
