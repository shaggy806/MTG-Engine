import { defineCard } from "../define.js";

// EDHREC rank 2481.
//
// The grant is Esika, God of the Tree's shape over every creature you control
// (Inga and Esika included), with Clement's creature-spell restriction on the
// mana. The intervening "if" is a `manaFrom` clause on the cast spell: where
// each unit of mana came from is fixed once it's paid, so asking again on
// resolution can't change the answer.
const MANA_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.";
const GRANT_TEXT = `Creatures you control have vigilance and "${MANA_TEXT}"`;
const DRAW_TEXT =
  "Whenever you cast a creature spell, if three or more mana from creatures was spent to cast it, draw a card.";

export default defineCard({
  name: "Inga and Esika",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "God"],
  power: 4,
  toughness: 4,
  text: `${GRANT_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["vigilance"],
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: {
            kind: "add-mana",
            mana: "any-color",
            amount: 1,
            spendOnly: {
              spell: { type: "creature" },
              text: "Spend this mana only to cast a creature spell.",
            },
          },
          resolve: null,
          text: MANA_TEXT,
        },
      ],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { type: "creature", manaFrom: { type: "creature", atLeast: 3 } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
