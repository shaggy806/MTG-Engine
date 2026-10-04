import { defineCard } from "../define.js";

// EDHREC rank 6327.

const MANA_TEXT = "{1}, {T}: Add {U}{B}{R}. Spend this mana only to cast instant and/or sorcery spells.";
const DIES_TEXT = "When Cormela dies, return up to one target instant or sorcery card from your graveyard to your hand.";

export default defineCard({
  name: "Cormela, Glamour Thief",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 2,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${MANA_TEXT}\n${DIES_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { all: ["U", "B", "R"] },
        amount: 1,
        spendOnly: {
          spell: { typesAnyOf: ["instant", "sorcery"] },
          text: "Spend this mana only to cast instant and/or sorcery spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "optional",
          of: { kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
