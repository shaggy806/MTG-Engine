import { defineCard } from "../define.js";

export default defineCard({
  name: "Havenwood Wurm",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 5,
  toughness: 6,
  keywords: ["flash", "trample"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nTrample",
});
