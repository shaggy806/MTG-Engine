import { defineCard } from "../define.js";

export default defineCard({
  name: "Reliquary Monk",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk", "Cleric"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, destroy target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature dies, destroy target artifact or enchantment.",
    },
  ],
});
