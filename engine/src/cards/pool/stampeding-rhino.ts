import { defineCard } from "../define.js";

export default defineCard({
  name: "Stampeding Rhino",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
