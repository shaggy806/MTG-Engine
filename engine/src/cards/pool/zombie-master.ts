import { defineCard } from "../define.js";
import { regenerateSelfAbility } from "../helpers.js";

const WALK_TEXT = "Other Zombie creatures have swampwalk. (They can't be blocked as long as defending player controls a Swamp.)";
const REGEN_TEXT = 'Other Zombies have "{B}: Regenerate this permanent."';

export default defineCard({
  name: "Zombie Master",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 3,
  text: `${WALK_TEXT}\n${REGEN_TEXT}`,
  static: [
    {
      // Every player's, not just yours.
      affects: { scope: "filter", filter: { type: "creature", subtype: "Zombie" }, excludeSelf: true },
      grantKeywords: ["swampwalk"],
      text: WALK_TEXT,
    },
    {
      // "Other Zombies": any Zombie permanent, creature or not.
      affects: { scope: "filter", filter: { subtype: "Zombie" }, excludeSelf: true },
      grantsActivated: [regenerateSelfAbility("{B}", "{B}: Regenerate this permanent.")],
      text: REGEN_TEXT,
    },
  ],
});
