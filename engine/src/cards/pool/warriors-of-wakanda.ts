import { defineCard } from "../define.js";

export default defineCard({
  name: "Warriors of Wakanda",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player it's attacking.)",
});
