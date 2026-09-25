import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Solifuge",
  manaCost: "{2}{R/G}{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 4,
  toughness: 1,
  keywords: ["trample", "haste", "shroud"],
  text: "({R/G} can be paid with either {R} or {G}.)\nTrample; haste; shroud (This creature can't be the target of spells or abilities.)",
});
