import { defineCard } from "../define.js";

// The granted blitz works as a printed one (rule 702.152a): cast from the
// hand for its mana cost, with haste and "when this creature dies, draw a
// card", sacrificed at the beginning of the next end step. The discount
// applies to every blitz cost its controller pays, printed or granted.
const GRANT_TEXT =
  'Each creature spell you cast with mana value 4 or greater has blitz. The blitz cost is equal to its mana cost. (You may choose to cast that spell for its blitz cost. If you do, it gains haste and "When this creature dies, draw a card." Sacrifice it at the beginning of the next end step.)';
const DISCOUNT_TEXT =
  "Blitz costs you pay cost {1} less for each time you've cast your commander from the command zone this game.";

export default defineCard({
  name: "Henzie \"Toolbox\" Torre",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Devil", "Rogue"],
  power: 3,
  toughness: 3,
  text: `${GRANT_TEXT}\n${DISCOUNT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsBlitzInHand: { filter: { type: "creature", manaValue: { op: "gte", n: 4 } } },
      text: GRANT_TEXT,
    },
    {
      affects: { scope: "self" },
      blitzCostReductionPerCommanderCast: true,
      text: DISCOUNT_TEXT,
    },
  ],
});
