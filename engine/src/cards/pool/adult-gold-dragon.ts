import { defineCard } from "../define.js";

export default defineCard({
  name: "Adult Gold Dragon",
  manaCost: "{3}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flying", "lifelink", "haste"],
  text: "Flying, lifelink, haste",
});
