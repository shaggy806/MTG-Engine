import { defineCard } from "../define.js";

export default defineCard({
  name: "Charging Monstrosaur",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 5,
  keywords: ["trample", "haste"],
  text: "Trample, haste",
});
