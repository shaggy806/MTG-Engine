import { defineCard } from "../define.js";

// EDHREC rank 5406.
//
// Rulings:
//   [2019-08-23] Song of the Worldsoul's ability will resolve before the spell that caused it to
//     trigger but after targets have been chosen for that spell. It resolves even if that spell is
//     countered.
//   [2024-01-12] The new creature token copies the characteristics of the original token as stated
//     by the effect that created the original token.
//   [2024-01-12] If you control no creature tokens when you populate, nothing will happen.
//   [2024-01-12] Populate doesn't target the creature token you're copying. You choose that
//     creature token as you're taking the populate action. You can choose any creature token you
//     control. If a spell or ability causes you to create a creature token and then instructs you
//     to populate, you may choose to copy the token you just created, or you may choose to copy
//     another creature token you control.
//   [2024-01-12] Any enters-the-battlefield abilities of the copied token will trigger when the
//     new token enters the battlefield. Any "as [this creature] enters the battlefield" or "[this
//     creature] enters the battlefield with" abilities of the copied token will also work.
//   [2024-01-12] The new token doesn't copy whether the original token is tapped or untapped,
//     whether it has any counters on it or Auras and Equipment attached to it, or any noncopy
//     effects that have changed its power, toughness, color, and so on.
//   [2024-01-12] If you choose to copy a creature token that's a copy of another creature, the new
//     creature token will copy the characteristics of whatever the original token is copying.

export default defineCard({
  name: "Song of the Worldsoul",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever you cast a spell, populate. (Create a token that's a copy of a creature token you control.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "populate" },
      resolve: null,
      text: "Whenever you cast a spell, populate.",
    },
  ],
});
