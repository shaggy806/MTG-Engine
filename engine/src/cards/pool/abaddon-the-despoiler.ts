import { defineCard } from "../define.js";

// #453 in top-commanders.txt.
//
// Cascade is granted to the spell as a `this-cast` trigger, so it fires as
// the spell is cast; X is read then.
const TEXT =
  "Mark of Chaos Ascendant — During your turn, spells you cast from your hand with mana value X or " +
  "less have cascade, where X is the total amount of life your opponents have lost this turn.";

export default defineCard({
  name: "Abaddon the Despoiler",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Astartes", "Warrior"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantsToSpells: {
        castFrom: ["hand"],
        filter: { manaValue: { op: "lte", n: { amount: { turnStat: "life-lost", who: "each-opponent" } } } },
        triggered: [
          {
            trigger: { on: "this-cast" },
            targets: [],
            effect: { kind: "cascade" },
            resolve: null,
            text: "Cascade",
          },
        ],
      },
      text: TEXT,
    },
  ],
});
