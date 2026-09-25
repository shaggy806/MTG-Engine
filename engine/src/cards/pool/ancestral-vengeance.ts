import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancestral Vengeance",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, put a +1/+1 counter on target creature you control.\nEnchanted creature gets -1/-1.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this Aura enters, put a +1/+1 counter on target creature you control.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-1, -1],
      text: "Enchanted creature gets -1/-1.",
    },
  ],
});
