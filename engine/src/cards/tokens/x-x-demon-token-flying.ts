import { defineCard } from "../define.js";

/** X/X black Demon with flying — Reign of the Pit's token. Its printed power
 * and toughness are stars: the effect that makes it sets its base P/T
 * (`basePt`). */
export default defineCard({
  name: "X/X Demon Token (Flying)",
  art: "27fcc389-1da9-4ed1-b56b-6f313a3a748e",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 0,
  toughness: 0,
  keywords: ["flying"],
  text: "Flying",
});
