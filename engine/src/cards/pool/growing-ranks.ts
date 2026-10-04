import { defineCard } from "../define.js";

// EDHREC rank 4628.
//
// Rulings:
//   [2024-01-12] The new creature token copies the characteristics of the original token as stated
//     by the effect that created the original token.
//   [2024-01-12] If you control no creature tokens when you populate, nothing will happen.
//   [2024-01-12] The new token doesn't copy whether the original token is tapped or untapped,
//     whether it has any counters on it or Auras and Equipment attached to it, or any noncopy
//     effects that have changed its power, toughness, color, and so on.
//   [2024-01-12] Populate doesn't target the creature token you're copying. You choose that
//     creature token as you're taking the populate action. You can choose any creature token you
//     control. If a spell or ability causes you to create a creature token and then instructs you
//     to populate, you may choose to copy the token you just created, or you may choose to copy
//     another creature token you control.
//   [2024-01-12] If you choose to copy a creature token that's a copy of another creature, the new
//     creature token will copy the characteristics of whatever the original token is copying.
//   [2024-01-12] Any enters-the-battlefield abilities of the copied token will trigger when the
//     new token enters the battlefield. Any "as [this creature] enters the battlefield" or "[this
//     creature] enters the battlefield with" abilities of the copied token will also work.
//
// Nesting Dovehawk's populate trigger, at upkeep.

const TEXT = "At the beginning of your upkeep, populate. (Create a token that's a copy of a creature token you control.)";

export default defineCard({
  name: "Growing Ranks",
  manaCost: "{2}{G/W}{G/W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "populate" },
      resolve: null,
      text: TEXT,
    },
  ],
});
