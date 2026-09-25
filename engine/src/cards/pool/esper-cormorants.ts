import { defineCard } from "../define.js";

export default defineCard({
  name: "Esper Cormorants",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying",
});
