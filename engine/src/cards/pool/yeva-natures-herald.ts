import { defineCard } from "../define.js";

const FLASH_TEXT = "You may cast green creature spells as though they had flash.";

export default defineCard({
  name: "Yeva, Nature's Herald",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 4,
  toughness: 4,
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\n${FLASH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { type: "creature", colors: ["G"] },
      text: FLASH_TEXT,
    },
  ],
});
