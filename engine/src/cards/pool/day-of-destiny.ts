import { defineCard } from "../define.js";

// EDHREC rank 6423.

const TEXT = "Legendary creatures you control get +2/+2.";

export default defineCard({
  name: "Day of Destiny",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", supertype: "legendary" } },
      grantPt: [2, 2],
      text: TEXT,
    },
  ],
});
