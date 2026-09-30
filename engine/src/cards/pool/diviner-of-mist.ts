import { defineCard } from "../define.js";

// Any instant or sorcery in the graveyard, not only one just milled; cast as
// the trigger resolves (rule 608.2g) and exiled rather than put back.
const TEXT =
  "Whenever this creature attacks, mill four cards. You may cast an instant or sorcery spell from your graveyard with mana value 4 or less without paying its mana cost. If that spell would be put into your graveyard, exile it instead.";

export default defineCard({
  name: "Diviner of Mist",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 4 },
          {
            kind: "cast-now",
            from: "graveyard",
            free: true,
            spell: { typesAnyOf: ["instant", "sorcery"], manaValue: { op: "lte", n: 4 } },
            exileAfter: true,
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
