import { defineCard } from "../define.js";

export default defineCard({
  name: "Hawkeye, Clint Barton",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Archer", "Hero"],
  power: 3,
  toughness: 5,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)",
});
