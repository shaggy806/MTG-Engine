import { defineCard } from "../define.js";

// The token half of Doubling Season. The multiplier is read for the player
// the tokens are created *under* (`tokenCreationMultiplier`), so a Beast
// Within aimed at your own permanent doubles, and one aimed at an opponent's
// doesn't. Two of these make four times as many (the 2017 ruling).
export default defineCard({
  name: "Anointed Procession",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "If an effect would create one or more tokens under your control, it creates twice that many of those tokens instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text:
        "If an effect would create one or more tokens under your control, it creates twice that many of those tokens instead.",
    },
  ],
});
