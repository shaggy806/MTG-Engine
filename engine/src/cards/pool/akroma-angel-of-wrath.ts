import { defineCard } from "../define.js";

// EDHREC rank 4493.

export default defineCard({
  name: "Akroma, Angel of Wrath",
  manaCost: "{5}{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "first-strike", "vigilance", "trample", "haste"],
  text: "Flying, first strike, vigilance, trample, haste, protection from black and from red",
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["B", "R"] },
      text: "Protection from black and from red",
    },
  ],
});
