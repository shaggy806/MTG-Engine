import { defineCard } from "../define.js";

// #188 in top-commanders.txt.
//
// The prevention replacement's `then` is its controller's effect, with "x"
// the damage prevented.
const UNBLOCKABLE_TEXT = "The Mindskinner can't be blocked.";
const REPLACEMENT_TEXT =
  "If a source you control would deal damage to an opponent, prevent that damage and each " +
  "opponent mills that many cards.";

export default defineCard({
  name: "The Mindskinner",
  manaCost: "{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Nightmare"],
  power: 10,
  toughness: 1,
  keywords: ["unblockable"],
  text: `${UNBLOCKABLE_TEXT}\n${REPLACEMENT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        prevent: true,
        source: { controlledBy: "you" },
        to: "opponent",
        then: { kind: "mill", target: "each-opponent", amount: "x" },
      },
      text: REPLACEMENT_TEXT,
    },
  ],
});
