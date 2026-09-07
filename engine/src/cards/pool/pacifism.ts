import { defineCard } from "../define.js";

export default defineCard({
  name: "Pacifism",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature. Enchanted creature can't attack or block.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      restrictions: ["cant-attack", "cant-block"],
      text: "Enchanted creature can't attack or block.",
    },
  ],
});
