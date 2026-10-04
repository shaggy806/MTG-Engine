import { defineCard } from "../define.js";

// EDHREC rank 5873.

const GRANT_TEXT = "Other green creatures you control have intimidate.";

export default defineCard({
  name: "Bellowing Tanglewurm",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 4,
  toughness: 4,
  keywords: ["intimidate"],
  text: `Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)\n${GRANT_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["G"], controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["intimidate"],
      text: GRANT_TEXT,
    },
  ],
});
