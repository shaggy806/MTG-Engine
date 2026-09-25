import { defineCard } from "../define.js";

export default defineCard({
  name: "Wind Spirit",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Spirit"],
  power: 3,
  toughness: 2,
  keywords: ["flying", "menace"],
  text: "Flying\nMenace (This creature can't be blocked except by two or more creatures.)",
});
