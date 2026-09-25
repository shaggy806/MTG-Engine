import { defineCard } from "../define.js";

export default defineCard({
  name: "Wildwood Patrol",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur", "Scout"],
  power: 4,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
