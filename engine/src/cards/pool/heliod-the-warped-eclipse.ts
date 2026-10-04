import { defineCard } from "../define.js";

const FLASH_TEXT = "You may cast spells as though they had flash.";
const COST_TEXT = "Spells you cast cost {1} less to cast for each card your opponents have drawn this turn.";

// The reduction is generic only and changes the total cost, not the mana value
// (the rulings); it applies to alternative costs such as flashback too.
export default defineCard({
  name: "Heliod, the Warped Eclipse",
  art: "https://cards.scryfall.io/art_crop/back/a/7/a7113c93-6c6d-410f-aeec-abc5ee121cdf.jpg",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Phyrexian", "God"],
  power: 4,
  toughness: 6,
  text: `${FLASH_TEXT}\n${COST_TEXT}`,
  faces: ["Heliod, the Radiant Dawn", "Heliod, the Warped Eclipse"],
  transform: true,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: true,
      text: FLASH_TEXT,
    },
    {
      affects: { scope: "self" },
      costModification: {
        applies: {},
        caster: "you",
        reduceGeneric: { turnStat: "cards-drawn", who: "opponent" },
      },
      text: COST_TEXT,
    },
  ],
});
