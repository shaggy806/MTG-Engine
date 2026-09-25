import { defineCard } from "../define.js";

export default defineCard({
  name: "Slash Panther",
  manaCost: "{4}{R/P}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Cat"],
  power: 4,
  toughness: 2,
  keywords: ["haste"],
  text: "({R/P} can be paid with either {R} or 2 life.)\nHaste",
});
