import { defineCard } from "../define.js";

// A 2/2 black Vampire with flying — Bloodline Keeper's token.
export default defineCard({
  name: "Vampire Token",
  art: "https://scryfall.com/card/tisd/6/vampire",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
