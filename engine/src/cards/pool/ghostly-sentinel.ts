import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghostly Sentinel",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
