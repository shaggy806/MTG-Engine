import { defineCard } from "../define.js";

/** 6/6 red Dragon with flying — Utvara Hellkite's token ("Dragon Token" is
 * the 5/5 one Lathliss makes; the engine keys tokens by name so this needs
 * its own). */
export default defineCard({
  name: "6/6 Dragon Token",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying",
});
