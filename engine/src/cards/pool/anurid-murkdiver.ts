import { defineCard } from "../define.js";

export default defineCard({
  name: "Anurid Murkdiver",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Frog", "Beast"],
  power: 4,
  toughness: 3,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});
