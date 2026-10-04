import { defineCard } from "../define.js";

// EDHREC rank 5653.
//
// The granted mana ability is Resonating Lute's shape: `spendOnly` stamps the
// mana so it pays only for an instant or sorcery spell.
const GRANTED_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast an instant or sorcery spell.";
const ARTIFACTS_TEXT = `Artifacts you control have "${GRANTED_TEXT}"`;
const ENTER_TEXT = "When Galazeth Prismari enters, create a Treasure token.";

export default defineCard({
  name: "Galazeth Prismari",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${ARTIFACTS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: {
            kind: "add-mana",
            mana: "any-color",
            amount: 1,
            spendOnly: {
              spell: { typesAnyOf: ["instant", "sorcery"] },
              text: "Spend this mana only to cast an instant or sorcery spell.",
            },
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: ARTIFACTS_TEXT,
    },
  ],
});
