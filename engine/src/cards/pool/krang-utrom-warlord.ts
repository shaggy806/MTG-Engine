import { defineCard } from "../define.js";

// EDHREC rank 3517.

export default defineCard({
  name: "Krang, Utrom Warlord",
  manaCost: "{9}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Utrom", "Robot"],
  power: 9,
  toughness: 9,
  keywords: ["flying", "trample", "indestructible", "haste"],
  text: "Flying, trample, indestructible, haste\nOther artifact creatures you control have flying, trample, indestructible, and haste.",
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["flying", "trample", "indestructible", "haste"],
      text: "Other artifact creatures you control have flying, trample, indestructible, and haste.",
    },
  ],
});
