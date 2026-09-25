import { defineCard } from "../define.js";

export default defineCard({
  name: "High Priest of Penance",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "Whenever this creature is dealt damage, you may destroy target nonland permanent.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: ["nonland-permanent"],
      effect: {
        kind: "may",
        prompt: "Destroy target nonland permanent?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "Whenever this creature is dealt damage, you may destroy target nonland permanent.",
    },
  ],
});
