import { defineCard } from "../define.js";

export default defineCard({
  name: "Duskdale Wurm",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
