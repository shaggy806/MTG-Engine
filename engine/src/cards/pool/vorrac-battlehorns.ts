import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 5970.
const GRANT = "Equipped creature has trample and can't be blocked by more than one creature.";

export default defineCard({
  name: "Vorrac Battlehorns",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${GRANT}\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["trample"],
      blockedByAtMostOne: true,
      text: GRANT,
    },
  ],
  activated: [equip("{1}")],
});
