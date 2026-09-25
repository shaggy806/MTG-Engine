import { defineCard } from "../define.js";

export default defineCard({
  name: "Hired Poisoner",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
