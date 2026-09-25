import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Mist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 5,
  keywords: ["defender"],
  text: "Defender",
});
