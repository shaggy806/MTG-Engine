import { defineCard } from "../define.js";

// EDHREC rank 6018.

const TEXT =
  "{T}: Add two mana of any one color. Spend this mana only to cast artifact spells or activate abilities of artifacts.";

export default defineCard({
  name: "Vedalken Engineer",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Artificer"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // `any-color` with amount 2 is two mana of any **one** colour.
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 2,
        spendOnly: {
          spell: { type: "artifact" },
          abilityOf: { type: "artifact" },
          text: "Spend this mana only to cast artifact spells or activate abilities of artifacts.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
