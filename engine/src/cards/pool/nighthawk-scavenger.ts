import { defineCard } from "../define.js";

const CDA_TEXT =
  "Nighthawk Scavenger's power is equal to 1 plus the number of card types among cards in your opponents' graveyards.";

export default defineCard({
  name: "Nighthawk Scavenger",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "deathtouch", "lifelink"],
  text: `Flying, deathtouch, lifelink\n${CDA_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { cardTypesInGraveyard: { ownedBy: "opponent" } },
        plusPower: 1,
        plusToughness: 0,
        only: "power",
      },
      text: CDA_TEXT,
    },
  ],
});
