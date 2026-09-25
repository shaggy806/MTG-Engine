import { defineCard } from "../define.js";

export default defineCard({
  name: "Stern Proctor",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, return target artifact or enchantment to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "When this creature enters, return target artifact or enchantment to its owner's hand.",
    },
  ],
});
