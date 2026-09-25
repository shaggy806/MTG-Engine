import { defineCard } from "../define.js";

// #382 in top-commanders.txt.
const TEXT =
  "If an opponent would mill one or more cards, they mill twice that many cards instead. (To mill a " +
  "card, a player puts the top card of their library into their graveyard.)";

export default defineCard({
  name: "Bruvac the Grandiloquent",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 4,
  text: TEXT,
  static: [{ affects: { scope: "self" }, replacement: { event: "would-mill", who: "opponent", multiplier: 2 }, text: TEXT }],
});
