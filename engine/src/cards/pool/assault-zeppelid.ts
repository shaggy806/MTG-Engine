import { defineCard } from "../define.js";

export default defineCard({
  name: "Assault Zeppelid",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "trample"],
  text: "Flying, trample",
});
