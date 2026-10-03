import { defineCard } from "../define.js";

/** 1/1 black Insect with flying — Eumidian Hatchery's and Scouring Swarm's
 * token. Distinct from the green, black-green and blue-red Insects. */
export default defineCard({
  name: "Insect Token (Black, Flying)",
  art: "2172a126-2ea6-4b5c-84c2-7879c1982a3a",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
