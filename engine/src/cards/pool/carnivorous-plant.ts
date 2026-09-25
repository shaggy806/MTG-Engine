import { defineCard } from "../define.js";

export default defineCard({
  name: "Carnivorous Plant",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Wall"],
  power: 4,
  toughness: 5,
  keywords: ["defender"],
  text: "Defender",
});
