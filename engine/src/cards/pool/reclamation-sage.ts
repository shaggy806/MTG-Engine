import { defineCard } from "../define.js";

export default defineCard({
  name: "Reclamation Sage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 1,
  text: "When Reclamation Sage enters the battlefield, you may destroy target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy the target artifact or enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text:
        "When Reclamation Sage enters the battlefield, you may destroy target artifact or " +
        "enchantment.",
    },
  ],
});
