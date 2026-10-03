import { defineCard } from "../define.js";

// #481 in top-commanders.txt.
const CASUALTY_TEXT =
  "The first instant or sorcery spell you cast each turn has casualty 2. (As you cast that spell, you may " +
  "sacrifice a creature with power 2 or greater. When you do, copy the spell and you may choose new targets " +
  "for the copy.)";

// "The first" counts every instant and sorcery you cast this turn, ones cast
// before Anhelo arrived included (`firstEachTurn`).
export default defineCard({
  name: "Anhelo, the Painter",
  manaCost: "{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Assassin"],
  power: 1,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${CASUALTY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { typesAnyOf: ["instant", "sorcery"] }, firstEachTurn: true, casualty: 2 },
      text: CASUALTY_TEXT,
    },
  ],
});
