import { defineCard } from "../define.js";

/** 10/10 colourless Eldrazi — Idol of Oblivion's token. Colourless, so it
 * carries no `colors`. */
export default defineCard({
  name: "Eldrazi Token",
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 10,
});
