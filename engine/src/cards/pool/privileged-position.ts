import { defineCard } from "../define.js";

// EDHREC rank 3328.

export default defineCard({
  name: "Privileged Position",
  manaCost: "{2}{G/W}{G/W}{G/W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: "({G/W} can be paid with either {G} or {W}.)\nOther permanents you control have hexproof. (They can't be the targets of spells or abilities your opponents control.)",
  static: [
    {
      // Sigarda, Font of Blessings' shape.
      affects: { scope: "filter", filter: { controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: "Other permanents you control have hexproof.",
    },
  ],
});
