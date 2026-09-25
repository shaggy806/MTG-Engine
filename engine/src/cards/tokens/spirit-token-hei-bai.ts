import { defineCard } from "../define.js";

/** Hei Bai, Forest Guardian's 1/1 colorless Spirit. */
const TEXT = "This token can't block or be blocked by non-Spirit creatures.";

export default defineCard({
  name: "Spirit Token (Colorless, Evasive)",
  art: "f59eba51-458a-40e0-b754-999f91d5d839",
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      cantBeBlockedBy: { type: "creature", notSubtypes: ["Spirit"] },
      text: TEXT,
    },
  ],
});
