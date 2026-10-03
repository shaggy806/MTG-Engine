import { defineCard } from "../define.js";

const FLASH_TEXT = "You may cast sorcery spells and Dragon spells as though they had flash.";

// An omen card (rule 720): cast as the creature, or as Dynamic Soar. A spell
// is judged as the spell it would be (720.3a) — an Omen is a sorcery, an
// omen card's creature half a Dragon or not by its own type line.
export default defineCard({
  name: "Whirlwing Stormbrood",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${FLASH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { anyOf: [{ type: "sorcery" }, { subtype: "Dragon" }] },
      text: FLASH_TEXT,
    },
  ],
  faces: ["Whirlwing Stormbrood", "Dynamic Soar"],
  omen: true,
});
