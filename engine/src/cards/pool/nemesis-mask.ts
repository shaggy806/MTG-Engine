import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 6700. Lure on an Equipment: every creature of the defending
// player's able to block the equipped creature must (rule 509.1c), checked
// as blockers are declared.
const LURE_TEXT = "All creatures able to block equipped creature do so.";

export default defineCard({
  name: "Nemesis Mask",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${LURE_TEXT}\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [{ affects: { scope: "attached" }, restrictions: ["must-be-blocked"], text: LURE_TEXT }],
  activated: [equip("{3}")],
});
