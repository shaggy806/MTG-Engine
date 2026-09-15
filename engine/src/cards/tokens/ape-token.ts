import { defineCard } from "../define.js";

// A 3/3 green Ape — Pongify's token.
export default defineCard({
  name: "Ape Token",
  art: "https://scryfall.com/card/tc21/7/ape",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ape"],
  power: 3,
  toughness: 3,
});
