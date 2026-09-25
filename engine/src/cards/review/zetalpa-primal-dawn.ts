import { defineCard } from "../define.js";

// REVIEW — auto-finished by `npm run card:scaffold` from the Oracle snapshot: its text
// is only keywords the engine models, so nothing was left to author. Not in the
// registry: check it against the card's Oracle text, then move it into cards/pool/
// (or tokens/) and run `npm run gen:cards -w engine`.
// EDHREC rank 1649.

export default defineCard({
  name: "Zetalpa, Primal Dawn",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 4,
  toughness: 8,
  keywords: ["flying", "double-strike", "vigilance", "trample", "indestructible"],
  text: "Flying, double strike, vigilance, trample, indestructible",
});
