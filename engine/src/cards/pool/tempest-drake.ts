import { defineCard } from "../define.js";

export default defineCard({
  name: "Tempest Drake",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
