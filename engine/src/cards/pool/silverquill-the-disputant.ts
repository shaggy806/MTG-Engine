import { defineCard } from "../define.js";

// #230 in top-commanders.txt.
const CASUALTY_TEXT =
  "Each instant and sorcery spell you cast has casualty 1. (As you cast that spell, you may sacrifice a " +
  "creature with power 1 or greater. When you do, copy the spell and you may choose new targets for the copy.)";

export default defineCard({
  name: "Silverquill, the Disputant",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${CASUALTY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { typesAnyOf: ["instant", "sorcery"] }, casualty: 1 },
      text: CASUALTY_TEXT,
    },
  ],
});
