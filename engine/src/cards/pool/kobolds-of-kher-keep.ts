import { defineCard } from "../define.js";

/** A real card, and also what Prossh, Skyraider of Kher's tokens are named:
 * "0/1 red Kobold creature tokens named Kobolds of Kher Keep". A token made
 * from this definition has the same body the printed token does. */
export default defineCard({
  name: "Kobolds of Kher Keep",
  manaCost: "{0}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Kobold"],
  power: 0,
  toughness: 1,
});
