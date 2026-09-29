import { defineCard } from "../define.js";

const TEXT =
  "Creatures you control have flying, first strike, vigilance, trample, haste, and protection from black and from red.";

export default defineCard({
  name: "Akroma's Memorial",
  manaCost: "{7}",
  colors: [],
  types: ["artifact"],
  supertypes: ["legendary"],
  text: TEXT,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["flying", "first-strike", "vigilance", "trample", "haste"],
      protection: { colors: ["B", "R"] },
      text: TEXT,
    },
  ],
});
