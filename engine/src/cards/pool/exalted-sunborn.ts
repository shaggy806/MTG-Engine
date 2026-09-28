import { defineCard } from "../define.js";

//
// Rulings:
//   [2025-07-25] Everything that is specified by the effect creating the original token or tokens
//     will also be true about the additional token or tokens created by Exalted Sunborn’s
//     replacement effect. For example, if an effect tells you to create a token “tapped and
//     attacking,” the additional tokens will also be tapped and attacking. Similarly, if an effect
//     creates a token and puts counters on it, the additional token will also get those counters.

export default defineCard({
  name: "Exalted Sunborn",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Wizard"],
  power: 4,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: "Flying, lifelink\nIf one or more tokens would be created under your control, twice that many of those tokens are created instead.\nWarp {1}{W} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  warp: { cost: "{1}{W}" },
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text: "If one or more tokens would be created under your control, twice that many of those tokens are created instead.",
    },
  ],
});
