import { defineCard } from "../define.js";

export default defineCard({
  name: "The Whizzer, Classic Speedster",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Hero"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste",
});
