import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ENTER_TEXT = "This land enters tapped with two charge counters on it.";
const ANY_TEXT = "{T}, Remove a charge counter from this land: Add one mana of any color.";

// The any-color ability's counter cost keeps it out of the auto-payer
// (AUTHORING §15); it's activated by hand, floating the mana.
export default defineCard({
  name: "Vivid Creek",
  colors: [],
  types: ["land"],
  text: `${ENTER_TEXT}\n{T}: Add {U}.\n${ANY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true, counters: { kind: "charge", amount: 2 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    addManaAbility({ mana: "U", text: "{T}: Add {U}." }),
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "charge", count: 1 } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: ANY_TEXT,
    },
  ],
});
