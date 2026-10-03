import { defineCard } from "../define.js";

// A copy of an Aura asks what it enchants just before it enters (its ruling).
export default defineCard({
  name: "Mirrormade",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "You may have this enchantment enter as a copy of any artifact or enchantment on the battlefield.",
  copyOnEnter: { filter: { typesAnyOf: ["artifact", "enchantment"] } },
});
