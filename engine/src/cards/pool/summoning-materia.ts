import { defineCard } from "../define.js";
import { addManaAbility, equip } from "../helpers.js";

// Rulings:
//   [2025-06-06] You must follow all normal timing rules for spells cast using the second ability
//     and must pay all costs for spells cast this way.
//   [2025-06-06] The top card of your library isn't in your hand, so you can't cycle it, discard
//     it, or activate any of its abilities that could be activated from your hand.

const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT =
  "As long as this Equipment is attached to a creature, you may cast creature spells from the top of your library.";
const GRANT_TEXT = 'Equipped creature gets +2/+2 and has vigilance and "{T}: Add {G}."';

// Elven Chorus's permission, switched on only while attached (a `source`
// condition on the Equipment's own `attachedTo`).
export default defineCard({
  name: "Summoning Materia",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${GRANT_TEXT}\nEquip {2}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { attachedTo: { type: "creature" } } },
      castFromLibraryTop: { filter: { type: "creature" } },
      text: CAST_TEXT,
    },
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["vigilance"],
      grantsActivated: [addManaAbility({ mana: "G", text: "{T}: Add {G}." })],
      text: GRANT_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
