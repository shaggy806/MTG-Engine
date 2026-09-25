import { defineCard } from "../define.js";

export default defineCard({
  name: "Highspire Mantis",
  manaCost: "{2}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "trample"],
  text: "Flying, trample",
});
