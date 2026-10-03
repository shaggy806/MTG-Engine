import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ANY_COLOR_TEXT = "{T}: Add one mana of any color. Activate only if this land entered this turn.";
const MITE_TEXT =
  '{3}, {T}: Create a 1/1 colorless Phyrexian Mite artifact creature token with toxic 1 and "This token ' +
  "can't block.\" (Players dealt combat damage by it also get a poison counter.)";

export default defineCard({
  name: "Mirrex",
  colors: [],
  types: ["land"],
  subtypes: ["Sphere"],
  text: `{T}: Add {C}.\n${ANY_COLOR_TEXT}\n${MITE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      ...addManaAbility({ mana: "any-color", text: ANY_COLOR_TEXT }),
      condition: { kind: "source", filter: { enteredThisTurn: true } },
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Phyrexian Mite Token", count: 1 },
      resolve: null,
      text: MITE_TEXT,
    },
  ],
});
