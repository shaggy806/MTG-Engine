import { defineCard } from "../define.js";

export default defineCard({
  name: "Gigantic Big Bear",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 10,
  toughness: 7,
  keywords: ["hexproof", "haste"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nHexproof, haste",
});
