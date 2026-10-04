import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2620. Rupture Spire's shape, with the Gate subtype.

const TAPPED_TEXT = "This land enters tapped.";
const SAC_TEXT = "When this land enters, sacrifice it unless you pay {1}.";

export default defineCard({
  name: "Gateway Plaza",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: `${TAPPED_TEXT}\n${SAC_TEXT}\n{T}: Add one mana of any color.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: TAPPED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "you",
        options: [{ pay: "{1}", text: "Pay {1}." }],
        otherwise: { kind: "sacrifice-source" },
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
