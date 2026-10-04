import { defineCard } from "../define.js";

// A spell's mana value is its mana cost's alone, X included as chosen. Once
// a spell has been cast with cascade, Imoti leaving doesn't stop it (the
// rulings).
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

export default defineCard({
  name: "Imoti, Celebrant of Bounty",
  manaCost: "{3}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Druid"],
  power: 3,
  toughness: 1,
  text:
    "Cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card " +
    "that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random " +
    "order.)\nSpells you cast with mana value 6 or greater have cascade.",
  triggered: [CASCADE],
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { manaValue: { op: "gte", n: 6 } }, triggered: [CASCADE] },
      text: "Spells you cast with mana value 6 or greater have cascade.",
    },
  ],
});
