import { defineCard } from "../define.js";

export default defineCard({
  name: "Land Leeches",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Leech"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike",
});
