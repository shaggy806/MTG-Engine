import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawnstrike Paladin",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance", "lifelink"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});
