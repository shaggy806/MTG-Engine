import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleetfoot Dancer",
  manaCost: "{1}{R}{G}{W}",
  colors: ["W", "R", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 4,
  toughness: 4,
  keywords: ["trample", "lifelink", "haste"],
  text: "Trample, lifelink, haste",
});
