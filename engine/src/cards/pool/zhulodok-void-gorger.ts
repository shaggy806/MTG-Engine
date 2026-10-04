import { defineCard } from "../define.js";

const TEXT =
  'Colorless spells you cast from your hand with mana value 7 or greater have "Cascade, cascade." (When you cast ' +
  "one, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it " +
  "without paying its mana cost. Put the exiled cards on the bottom in a random order. Then do it again.)";

// Two cascade triggers on each such spell, resolved one at a time (the
// rulings); Zhulodok leaving after the spell is cast doesn't stop them.
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

export default defineCard({
  name: "Zhulodok, Void Gorger",
  manaCost: "{5}{C}",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 7,
  toughness: 4,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: {
        castFrom: ["hand"],
        filter: { colorless: true, manaValue: { op: "gte", n: 7 } },
        triggered: [CASCADE, CASCADE],
      },
      text: TEXT,
    },
  ],
});
