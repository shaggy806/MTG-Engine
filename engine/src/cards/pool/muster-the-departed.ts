import { defineCard } from "../define.js";

// EDHREC rank 5913.
// Makes Spirit → use "Spirit Token".
//
// Rulings:
//   [2024-06-07] Muster the Departed's last ability will trigger only once during your end step,
//     no matter how many creatures died under your control this turn. However, if no creatures
//     have died under your control so far this turn as your end step begins, the ability won't
//     trigger at all. It's not possible to cause a creature to die under your control during the
//     end step in time to have the ability trigger.
//   [2024-06-07] Muster the Departed doesn't need to have been on the battlefield when the
//     creature died. For example, if a creature dies during combat on your turn and you cast
//     Muster the Departed during your second main phase, its last ability will trigger at the
//     beginning of your end step.
//   [2024-06-07] Any "as [this creature] enters the battlefield" or "[this creature] enters the
//     battlefield with" abilities of the new token will work.
//   [2024-06-07] The new token doesn't copy whether the original token is tapped or untapped,
//     whether it has any counters on it or Auras and Equipment attached to it, or any non-copy
//     effects that have changed its power, toughness, color, and so on.
//   [2024-06-07] If you control no creature tokens when you populate, nothing will happen.
//   [2024-06-07] The new creature token copies the characteristics of the original token as stated
//     by the effect that created the original token.

export default defineCard({
  name: "Muster the Departed",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "When this enchantment enters, create a 1/1 white Spirit creature token with flying.\nMorbid — At the beginning of your end step, if a creature died this turn, populate. (Create a token that's a copy of a creature token you control.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "When this enchantment enters, create a 1/1 white Spirit creature token with flying.",
    },
    {
      // Deathreap Ritual's intervening "if" plus Growing Ranks' populate. The
      // Oracle text says "a creature" (any player's), which is what
      // `creature-died-this-turn` counts.
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: { kind: "populate" },
      resolve: null,
      text: "Morbid — At the beginning of your end step, if a creature died this turn, populate.",
    },
  ],
});
