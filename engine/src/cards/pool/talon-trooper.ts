import { defineCard } from "../define.js";

export default defineCard({
  name: "Talon Trooper",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Bird", "Scout"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying",
});
