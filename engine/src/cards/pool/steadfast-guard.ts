import { defineCard } from "../define.js";

export default defineCard({
  name: "Steadfast Guard",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Rebel"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)",
});
