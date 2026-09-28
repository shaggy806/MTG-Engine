import { defineCard } from "../define.js";
import { equip, myriad } from "../helpers.js";

// The copies are of the creature, not of the Equipment: they come in
// unequipped, with no myriad of their own from it (rule 707.2).
const TEXT =
  "Equipped creature has myriad. (Whenever it attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Blade of Selves",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {4}`,
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [myriad()],
      text: TEXT,
    },
  ],
  activated: [equip("{4}")],
});
