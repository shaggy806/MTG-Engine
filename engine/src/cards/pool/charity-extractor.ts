import { defineCard } from "../define.js";

export default defineCard({
  name: "Charity Extractor",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 5,
  keywords: ["lifelink"],
  text: "Lifelink",
});
