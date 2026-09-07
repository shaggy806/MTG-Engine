import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Control",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature. You control enchanted creature.",
  targets: ["creature"],
  controlEnchanted: true,
});
