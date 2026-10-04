import { defineCard } from "../define.js";

// Two separate cascade triggers: the spell the first casts resolves before
// the second exiles anything, and both look for less than the Wanderer's own
// mana value of 8 (the rulings). It gives itself haste.
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

export default defineCard({
  name: "Maelstrom Wanderer",
  manaCost: "{5}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 7,
  toughness: 5,
  text:
    "Creatures you control have haste.\nCascade, cascade (When you cast this spell, exile cards from the top of " +
    "your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. " +
    "Put the exiled cards on the bottom in a random order. Then do it again.)",
  triggered: [CASCADE, CASCADE],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
