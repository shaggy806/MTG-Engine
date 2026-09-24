import { defineCard } from "../define.js";

// "You" is the Aura's controller; the count is live, and includes this Aura.
export default defineCard({
  name: "All That Glitters",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    "Enchanted creature gets +1/+1 for each artifact and/or enchantment you control.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: {
        filter: { typesAnyOf: ["artifact", "enchantment"], controlledBy: "you" },
        pt: [1, 1],
      },
      text: "Enchanted creature gets +1/+1 for each artifact and/or enchantment you control.",
    },
  ],
});
