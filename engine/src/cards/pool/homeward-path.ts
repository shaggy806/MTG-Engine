import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 1197. One effect, so every creature changes hands at once
// (rule 613.7b); a token's owner is the player it entered under (the
// rulings — `GameObject.owner`).
const RETURN = "{T}: Each player gains control of all creatures they own.";

export default defineCard({
  name: "Homeward Path",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${RETURN}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "gain-control-all", filter: { type: "creature" }, untilEndOfTurn: false, who: "owner" },
      resolve: null,
      text: RETURN,
    },
  ],
});
