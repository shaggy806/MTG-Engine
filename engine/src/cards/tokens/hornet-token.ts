import { defineCard } from "../define.js";

/** 1/1 green Insect with flying and deathtouch — Hornet Queen's and Hornet
 * Nest's token. Distinct from the plain `Insect Token`, which has neither. */
export default defineCard({
  name: "Insect Token (Flying, Deathtouch)",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch",
});
