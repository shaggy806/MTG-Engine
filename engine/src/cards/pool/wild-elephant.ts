import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Elephant",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample",
});
