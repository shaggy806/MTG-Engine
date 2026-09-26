import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever enchanted creature attacks, scry 1.";

export default defineCard({
  name: "Aqueous Form",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\nEnchanted creature can't be blocked.\n" +
    `${ATTACK_TEXT} (Look at the top card of your library. You may put that card on the bottom.)`,
  targets: ["creature"],
  static: [
    { affects: { scope: "attached" }, grantKeywords: ["unblockable"], text: "Enchanted creature can't be blocked." },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
