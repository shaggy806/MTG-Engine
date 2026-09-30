import { defineCard } from "../define.js";

/** 1/1 red and white Soldier with haste — Assemble the Legion's token. */
export default defineCard({
  name: "Red-White Soldier Token",
  art: "bafa4e17-9da6-4abc-98f3-146cfa55fcf2",
  colors: ["R", "W"],
  types: ["creature"],
  subtypes: ["Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste",
});
