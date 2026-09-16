import { defineCard } from "../define.js";

// A 1/1 white Bird with flying — Migratory Route's token.
export default defineCard({
  name: "Bird Token",
  art: "https://scryfall.com/card/tdom/2/bird",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
