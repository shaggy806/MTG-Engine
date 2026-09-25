import { defineCard } from "../define.js";

export default defineCard({
  name: "Griffin Sentinel",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying\nVigilance (Attacking doesn't cause this creature to tap.)",
});
