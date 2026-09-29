import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const MANA_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast a Dragon creature spell.";
const RETURN_TEXT =
  "{2}, {T}, Sacrifice this land: Return target Dragon creature card or Ugin planeswalker card from your graveyard to your hand.";

export default defineCard({
  name: "Haven of the Spirit Dragon",
  types: ["land"],
  text: `{T}: Add {C}.\n${MANA_TEXT}\n${RETURN_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { type: "creature", subtype: "Dragon" },
          text: "Spend this mana only to cast a Dragon creature spell.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: {
            anyOf: [
              { type: "creature", subtype: "Dragon" },
              { type: "planeswalker", subtype: "Ugin" },
            ],
          },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
