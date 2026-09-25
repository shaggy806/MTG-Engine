import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloudchaser Eagle",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, destroy target enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target enchantment.",
    },
  ],
});
