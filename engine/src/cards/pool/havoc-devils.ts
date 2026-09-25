import { defineCard } from "../define.js";

export default defineCard({
  name: "Havoc Devils",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 4,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
