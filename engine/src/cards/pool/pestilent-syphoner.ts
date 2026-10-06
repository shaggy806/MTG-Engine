import { defineCard } from "../define.js";

export default defineCard({
  name: "Pestilent Syphoner",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  toxic: 1,
  text: "Flying\nToxic 1 (Players dealt combat damage by this creature also get a poison counter.)",
});
