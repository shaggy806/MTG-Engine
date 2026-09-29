import { defineCard } from "../define.js";
import { addManaAbility, enduringReturn } from "../helpers.js";

const MANA_TEXT = 'Creatures you control have "{T}: Add one mana of any color."';

// Once it has come back as an enchantment it still grants the ability to
// the creatures you control — just no longer to itself.
export default defineCard({
  name: "Enduring Vitality",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Elk", "Glimmer"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${MANA_TEXT}\n${enduringReturn("Enduring Vitality").text}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: MANA_TEXT,
    },
  ],
  triggered: [enduringReturn("Enduring Vitality")],
});
