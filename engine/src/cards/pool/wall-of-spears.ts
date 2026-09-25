import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Spears",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 2,
  toughness: 3,
  keywords: ["defender", "first-strike"],
  text: "Defender (This creature can't attack.)\nFirst strike",
});
