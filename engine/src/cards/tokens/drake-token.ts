import { defineCard } from "../define.js";

/** 2/2 blue Drake with flying — Talrand, Sky Summoner's token. Art is the
 * M13 printing, the set Talrand itself was printed in. */
export default defineCard({
  name: "Drake Token",
  art: "93679bb9-ee1c-4eea-bcdd-72785d5788af",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
