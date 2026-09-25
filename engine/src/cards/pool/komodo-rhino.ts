import { defineCard } from "../define.js";

export default defineCard({
  name: "Komodo Rhino",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Rhino"],
  power: 5,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player it's attacking.)",
});
