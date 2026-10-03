import { defineCard } from "../define.js";

// A copy of an Aura asks what it enchants just before it enters (its ruling).
export default defineCard({
  name: "Copy Enchantment",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "You may have this enchantment enter as a copy of any enchantment on the battlefield.",
  copyOnEnter: { filter: { type: "enchantment" } },
});
