import { defineCard } from "../define.js";

export default defineCard({
  name: "Vow of Duty",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    "Enchanted creature gets +2/+2, has vigilance, and can't attack you or " +
    "planeswalkers you control.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["vigilance"],
      // "You" is the Aura's controller — usually cast on an opponent's
      // creature, so it can still attack everyone else.
      cantAttackController: true,
      text:
        "Enchanted creature gets +2/+2, has vigilance, and can't attack you or " +
        "planeswalkers you control.",
    },
  ],
});
