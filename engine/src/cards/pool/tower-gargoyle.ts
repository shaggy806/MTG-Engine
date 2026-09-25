import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower Gargoyle",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  types: ["artifact", "creature"],
  subtypes: ["Gargoyle"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying",
});
