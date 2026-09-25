import { defineCard } from "../define.js";

export default defineCard({
  name: "Hippo-Cows",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hippo", "Ox"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player it's attacking.)",
});
