import { defineCard } from "../define.js";

/** 2/2 white Knight with vigilance — made by History of Benalia (Phase 10). */
export default defineCard({
  name: "Knight Token",
  // Tokens have no reliable by-name Scryfall entry — pin the printing (the
  // Dominaria Knight token History of Benalia mints). Any Scryfall link form
  // works; this is a card-page URL (see `client/src/ui/art.ts`).
  art: "e0bce908-fc95-40c6-a04a-752d56aca836",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance",
});
