import { defineCard } from "../define.js";

// #276 in top-commanders.txt.
//
// The second ability is a triggered mana ability (rule 605.1b): it adds its
// mana with the token's, off the stack, and the auto-payer counts it.
const METEORITE_TEXT =
  "Whenever Roxanne enters or attacks, create a tapped colorless artifact token named Meteorite with " +
  '"When this token enters, it deals 2 damage to any target" and "{T}: Add one mana of any color."';
const MANA_TEXT =
  "Whenever you tap an artifact token for mana, add one mana of any type that artifact token produced.";
const meteorite = { kind: "create-token", token: "Meteorite Token", count: 1, tapped: true } as const;

export default defineCard({
  name: "Roxanne, Starfall Savant",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Druid"],
  power: 4,
  toughness: 3,
  text: `${METEORITE_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: meteorite,
      resolve: null,
      text: METEORITE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: meteorite,
      resolve: null,
      text: METEORITE_TEXT,
    },
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { type: "artifact", token: true } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
