import { defineCard } from "../define.js";

const TRIPLE_TEXT =
  "If a source you control would deal damage to a permanent or player, it deals triple that damage instead.";

// Two Cities multiply to nine times (the ruling): each is its own
// multiplier.
export default defineCard({
  name: "City on Fire",
  manaCost: "{5}{R}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  convoke: true,
  text:
    "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n" +
    TRIPLE_TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 3, source: { controlledBy: "you" } },
      text: TRIPLE_TEXT,
    },
  ],
});
