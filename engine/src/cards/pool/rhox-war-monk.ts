import { defineCard } from "../define.js";

export default defineCard({
  name: "Rhox War Monk",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["creature"],
  subtypes: ["Rhino", "Monk"],
  power: 3,
  toughness: 4,
  keywords: ["lifelink"],
  text: "Lifelink",
});
