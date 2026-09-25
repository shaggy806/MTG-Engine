import { defineCard } from "../define.js";

export default defineCard({
  name: "Terra Stomper",
  manaCost: "{3}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 8,
  toughness: 8,
  keywords: ["trample"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nTrample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});
