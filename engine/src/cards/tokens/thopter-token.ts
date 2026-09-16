import { defineCard } from "../define.js";

/** 1/1 colourless Thopter artifact creature with flying (Inspired Sphinx,
 * Sharding Sphinx). Colourless, so it carries no `colors`. */
export default defineCard({
  name: "Thopter Token",
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
