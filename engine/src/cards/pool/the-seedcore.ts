import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 5733.
//
// The restricted mana is Haven of the Spirit Dragon's `spendOnly` shape; the
// Corrupted gate is Glistening Sphere's `player-counters` condition.

const MANA_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast Phyrexian creature spells.";
const CORRUPTED_TEXT =
  "Corrupted — {T}: Target 1/1 creature gets +2/+1 until end of turn. Activate only if an opponent has three or more poison counters.";

export default defineCard({
  name: "The Seedcore",
  colors: [],
  types: ["land"],
  subtypes: ["Sphere"],
  text: `{T}: Add {C}.\n${MANA_TEXT}\n${CORRUPTED_TEXT}`,
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
          spell: { type: "creature", subtype: "Phyrexian" },
          text: "Spend this mana only to cast Phyrexian creature spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      targets: [
        {
          kind: "permanent",
          filter: { type: "creature", power: { op: "eq", n: 1 }, toughness: { op: "eq", n: 1 } },
        },
      ],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: CORRUPTED_TEXT,
      condition: { kind: "player-counters", counter: "poison", who: "opponent", atLeast: 3 },
    },
  ],
});
