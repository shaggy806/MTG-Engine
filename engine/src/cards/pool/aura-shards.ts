import { defineCard } from "../define.js";

export default defineCard({
  name: "Aura Shards",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: "Whenever a creature you control enters, you may destroy target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: ["artifact-or-enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy target artifact or enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "Whenever a creature you control enters, you may destroy target artifact or enchantment.",
    },
  ],
});
