import { defineCard } from "../define.js";

export default defineCard({
  name: "Glamorous Grapplers",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Performer", "Villain"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});
