import { defineCard } from "../define.js";

export default defineCard({
  name: "Hawkeater Moth",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "shroud"],
  text: "Flying\nShroud (This creature can't be the target of spells or abilities.)",
});
