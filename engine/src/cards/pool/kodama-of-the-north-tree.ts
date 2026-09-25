import { defineCard } from "../define.js";

export default defineCard({
  name: "Kodama of the North Tree",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 6,
  toughness: 4,
  keywords: ["trample", "shroud"],
  text: "Trample\nShroud (This creature can't be the target of spells or abilities.)",
});
