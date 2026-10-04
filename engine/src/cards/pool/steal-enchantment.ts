import { defineCard } from "../define.js";

// EDHREC rank 6426.
//
// Rulings:
//   [2004-10-04] When a player takes control of an enchantment, they do not get to change anything
//     about the enchantment (such as what creature it is on, what choices it has or anything) at
//     that time. They just become its controller.

export default defineCard({
  name: "Steal Enchantment",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant enchantment\nYou control enchanted enchantment.",
  targets: ["enchantment"],
  controlEnchanted: true,
});
