import { defineCard } from "../define.js";

/** 1/1 white Spirit with flying — Hanged Executioner's and Moorland Haunt's
 * token. */
export default defineCard({
  name: "Spirit Token",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
