import { defineCard } from "../define.js";

export default defineCard({
  name: "Smaug, the Great Calamity",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying",
  faces: ["Smaug, the Great Calamity", "Spew Flame"],
  adventure: true,
});
