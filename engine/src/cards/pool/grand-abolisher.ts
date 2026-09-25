import { defineCard } from "../define.js";

const TEXT =
  "During your turn, your opponents can't cast spells or activate abilities of artifacts, creatures, or enchantments.";

export default defineCard({
  name: "Grand Abolisher",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      // Mana abilities are activated abilities too, so an opponent's lands
      // (not artifacts, creatures or enchantments) still tap, while their mana
      // rocks and dorks don't.
      prohibits: {
        who: "opponents",
        spells: true,
        abilitiesOf: { typesAnyOf: ["artifact", "creature", "enchantment"] },
      },
      text: TEXT,
    },
  ],
});
