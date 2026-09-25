import { defineCard } from "../define.js";

export default defineCard({
  name: "Aerial Responder",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Soldier"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "vigilance", "lifelink"],
  text: "Flying, vigilance, lifelink",
});
