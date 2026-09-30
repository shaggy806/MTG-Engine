import { defineCard } from "../define.js";

const LOCK_TEXT = "Your opponents can't cast spells during your turn.";

export default defineCard({
  name: "Dragonlord Dromoka",
  manaCost: "{4}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 5,
  toughness: 7,
  keywords: ["flying", "lifelink"],
  cantBeCountered: true,
  text: `This spell can't be countered.\nFlying, lifelink\n${LOCK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      prohibits: { who: "opponents", spells: true },
      text: LOCK_TEXT,
    },
  ],
});
