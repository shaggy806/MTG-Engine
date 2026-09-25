import { defineCard } from "../define.js";

export default defineCard({
  name: "Riptide Turtle",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Turtle"],
  power: 0,
  toughness: 5,
  keywords: ["flash", "defender"],
  text: "Flash\nDefender",
});
