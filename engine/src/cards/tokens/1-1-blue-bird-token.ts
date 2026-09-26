import { defineCard } from "../define.js";

// A 1/1 blue Bird with flying — Riku of Many Paths' token. ("Bird Token" is
// Migratory Route's 1/1 white one and "2/2 Blue Bird Token" Swan Song's; the
// engine keys tokens by name.)
export default defineCard({
  name: "1/1 Blue Bird Token",
  art: "000d9280-a79a-4f9f-822c-7aaecbff3337",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
