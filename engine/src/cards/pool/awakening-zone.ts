import { defineCard } from "../define.js";

const TEXT =
  'At the beginning of your upkeep, you may create a 0/1 colorless Eldrazi Spawn creature token. It has "Sacrifice this token: Add {C}."';

export default defineCard({
  name: "Awakening Zone",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 0/1 Eldrazi Spawn token?",
        effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
