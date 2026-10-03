import { defineCard } from "../define.js";

const CHOOSE_TEXT = "As Three Tree City enters, choose a creature type.";
const MANA_TEXT =
  "{2}, {T}: Choose a color. Add an amount of mana of that color equal to the number of creatures you control of the chosen type.";

// "Choose a color" is any one colour for all of it; the count reads the
// creature type Three Tree City named as it entered (`ofChosenType`).
export default defineCard({
  name: "Three Tree City",
  supertypes: ["legendary"],
  types: ["land"],
  text: `${CHOOSE_TEXT}\n{T}: Add {C}.\n${MANA_TEXT}`,
  chooseCreatureTypeOnEnter: true,
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
        amount: { countOf: { type: "creature", controlledBy: "you", ofChosenType: true } },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
