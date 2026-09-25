import { defineCard } from "../define.js";

export default defineCard({
  name: "Sokka, Wolf Cove's Protector",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)",
});
