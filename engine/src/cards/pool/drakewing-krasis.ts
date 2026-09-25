import { defineCard } from "../define.js";

export default defineCard({
  name: "Drakewing Krasis",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Lizard", "Drake"],
  power: 3,
  toughness: 1,
  keywords: ["flying", "trample"],
  text: "Flying, trample",
});
