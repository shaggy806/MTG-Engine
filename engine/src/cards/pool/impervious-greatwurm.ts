import { defineCard } from "../define.js";

// EDHREC rank 4430.

export default defineCard({
  name: "Impervious Greatwurm",
  manaCost: "{7}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 16,
  toughness: 16,
  keywords: ["indestructible"],
  convoke: true,
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nIndestructible",
});
