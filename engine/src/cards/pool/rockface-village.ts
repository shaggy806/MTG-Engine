import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 6156.

const PUMP_TEXT =
  "{R}, {T}: Target Lizard, Mouse, Otter, or Raccoon you control gets +1/+0 and gains haste until end of turn. Activate only as a sorcery.";

export default defineCard({
  name: "Rockface Village",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n{T}: Add {R}. Spend this mana only to cast a creature spell.\n${PUMP_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "R",
        amount: 1,
        spendOnly: {
          spell: { type: "creature" },
          text: "Spend this mana only to cast a creature spell.",
        },
      },
      resolve: null,
      text: "{T}: Add {R}. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: "{R}", tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { subtypes: ["Lizard", "Mouse", "Otter", "Raccoon"] } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
      sorcerySpeed: true,
    },
  ],
});
