import { defineCard } from "../define.js";

export default defineCard({
  name: "Fists of Ironwood",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, create two 1/1 green Saproling creature tokens.\nEnchanted creature has trample.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 2 },
      resolve: null,
      text: "When this Aura enters, create two 1/1 green Saproling creature tokens.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["trample"],
      text: "Enchanted creature has trample.",
    },
  ],
});
