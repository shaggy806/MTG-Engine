import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghost, Spectral Saboteur",
  manaCost: "{2}{U/B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue", "Villain"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nIntangibility — Ghost can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "Intangibility — Ghost can't be blocked.",
    },
  ],
});
