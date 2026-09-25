import { defineCard } from "../define.js";

export default defineCard({
  name: "Moldering Karok",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Zombie", "Crocodile"],
  power: 3,
  toughness: 3,
  keywords: ["trample", "lifelink"],
  text: "Trample, lifelink",
});
