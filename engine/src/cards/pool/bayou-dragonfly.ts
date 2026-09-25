import { defineCard } from "../define.js";

export default defineCard({
  name: "Bayou Dragonfly",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "swampwalk"],
  text: "Flying; swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});
