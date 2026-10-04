import { defineCard } from "../define.js";

// EDHREC rank 2495.
// Makes Blood → new token "Blood Token".
//
// Rulings:
//   [2021-11-19] A Vampire spell is a spell with the creature type Vampire on its type line,
//     regardless of whether the word "Vampire" is in its name.
//   [2025-01-24] If an effect refers to a Blood token, it means any artifact token with the
//     subtype Blood, even if it has gained other subtypes.
//   [2025-01-24] You can't sacrifice a Blood token to pay multiple costs.
//   [2025-01-24] Some triggered abilities trigger "whenever you sacrifice a Blood token." These
//     abilities trigger regardless of why you sacrificed that Blood token.
//
// The life-paying mana ability is Mana Confluence's with a Vampire-spell
// `spendOnly`; the Blood ability's reduction is Eiganjo's `costReduction`
// (generic only, which is all {5} is).

const VAMPIRE_MANA_TEXT = "{T}, Pay 1 life: Add one mana of any color. Spend this mana only to cast a Vampire spell.";
const BLOOD_TEXT =
  "{5}, {T}: Create a Blood token. This ability costs {1} less to activate for each Vampire you control.";

export default defineCard({
  name: "Voldaren Estate",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${VAMPIRE_MANA_TEXT}\n${BLOOD_TEXT} (It's an artifact with "{1}, {T}, Discard a card, Sacrifice this token: Draw a card.")`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { subtype: "Vampire" },
          text: "Spend this mana only to cast a Vampire spell.",
        },
      },
      resolve: null,
      text: VAMPIRE_MANA_TEXT,
    },
    {
      cost: { mana: "{5}", tap: true },
      costReduction: {
        reduceGeneric: { countOf: { subtype: "Vampire", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Blood Token", count: 1 },
      resolve: null,
      text: BLOOD_TEXT,
    },
  ],
});
