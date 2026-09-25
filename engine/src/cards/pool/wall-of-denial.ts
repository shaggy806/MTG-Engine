import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Denial",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 8,
  keywords: ["defender", "flying", "shroud"],
  text: "Defender, flying\nShroud (This creature can't be the target of spells or abilities.)",
});
