import { defineCard } from "../define.js";

export default defineCard({
  name: "The Terror of Serpent's Pass",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 8,
  toughness: 8,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)",
});
