import { defineCard } from "../define.js";

// A 2/2 blue Bird with flying — Swan Song's token. ("Bird Token" is the 1/1
// white one Migratory Route makes; the engine keys tokens by name, so a
// different body needs a different name.)
export default defineCard({
  name: "2/2 Blue Bird Token",
  art: "https://scryfall.com/card/tths/4/bird",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
