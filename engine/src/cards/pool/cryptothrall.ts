import { defineCard } from "../define.js";

// EDHREC rank 2749.

const TEXT = "Protector — Other artifact creatures you control have hexproof.";

export default defineCard({
  name: "Cryptothrall",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: TEXT,
    },
  ],
});
