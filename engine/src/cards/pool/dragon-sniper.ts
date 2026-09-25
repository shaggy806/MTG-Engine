import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Sniper",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Archer"],
  power: 1,
  toughness: 1,
  keywords: ["reach", "vigilance", "deathtouch"],
  text: "Reach, vigilance, deathtouch",
});
