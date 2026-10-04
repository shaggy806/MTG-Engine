import { defineCard } from "../define.js";

// EDHREC rank 2560.
//
// "X mana of any one color" is `any-color` × X: one colour, the payer's pick
// (Astral Cornucopia's shape); X counts the other Gates as it resolves.

const X_TEXT = "{2}, {T}: Add X mana of any one color, where X is the number of other Gates you control.";

export default defineCard({
  name: "Baldur's Gate",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  subtypes: ["Gate"],
  text: `{T}: Add {C}.\n${X_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { countOf: { subtype: "Gate", controlledBy: "you" }, excludeSelf: true },
      },
      resolve: null,
      text: X_TEXT,
    },
  ],
});
