import { defineCard } from "../define.js";

export default defineCard({
  name: "Air Elemental",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying",
});
