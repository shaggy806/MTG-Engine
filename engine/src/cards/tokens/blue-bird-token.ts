import { defineCard } from "../define.js";

// A 2/2 blue Bird with flying — Swan Song's token. ("Bird Token" is the 1/1
// white one Migratory Route makes; the engine keys tokens by name, so a
// different body needs a different name.)
export default defineCard({
  name: "2/2 Blue Bird Token",
  art: "ca72703f-d45b-4c80-98a8-55fad1fcf431",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
