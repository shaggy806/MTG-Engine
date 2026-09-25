import { defineCard } from "../define.js";

export default defineCard({
  name: "War Priest of Thune",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may destroy target enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy target enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target enchantment.",
    },
  ],
});
