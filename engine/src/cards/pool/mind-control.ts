import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Control",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nYou control enchanted creature.",
  targets: ["creature"],
  controlEnchanted: true,
});
