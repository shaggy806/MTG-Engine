import { defineCard } from "../define.js";

export default defineCard({
  name: "Ridgetop Raptor",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Beast"],
  power: 2,
  toughness: 1,
  keywords: ["double-strike"],
  text: "Double strike (This creature deals both first-strike and regular combat damage.)",
});
