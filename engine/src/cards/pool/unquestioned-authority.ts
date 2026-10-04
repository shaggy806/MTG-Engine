import { defineCard } from "../define.js";

// EDHREC rank 2497.
// The protection is Spirit Mantle's: protection from a card type.

export default defineCard({
  name: "Unquestioned Authority",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature has protection from creatures.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this Aura enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      protection: { types: ["creature"] },
      text: "Enchanted creature has protection from creatures.",
    },
  ],
});
