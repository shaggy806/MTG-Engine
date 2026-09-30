import { defineCard } from "../define.js";

const TEXT =
  "If a creature you control would deal damage to a permanent or player, it deals double that damage instead.";

// Dictate of the Twin Gods narrowed to your creatures: the source is read
// from this enchantment's controller's side, a departed source as it last
// existed.
export default defineCard({
  name: "Gratuitous Violence",
  manaCost: "{2}{R}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        multiplier: 2,
        source: { type: "creature", controlledBy: "you" },
      },
      text: TEXT,
    },
  ],
});
