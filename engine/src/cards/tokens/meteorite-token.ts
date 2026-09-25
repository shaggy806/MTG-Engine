import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

/** Roxanne, Starfall Savant's colorless artifact token named Meteorite. */
const ENTER_TEXT = "When this token enters, it deals 2 damage to any target.";
const MANA_TEXT = "{T}: Add one mana of any color.";

export default defineCard({
  name: "Meteorite Token",
  art: "00b41ca9-0bf0-41fc-af65-854e602ee007",
  types: ["artifact"],
  text: `${ENTER_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: MANA_TEXT })],
});
