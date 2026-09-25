import { defineCard } from "../define.js";

export default defineCard({
  name: "Deft Duelist",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike", "shroud"],
  text: "First strike\nShroud (This creature can't be the target of spells or abilities.)",
});
