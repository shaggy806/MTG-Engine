import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TEXT = "{2}, {T}: Target commander gains lifelink until end of turn.";

// Any player's commander on the battlefield, creature or not.
export default defineCard({
  name: "Witch's Clinic",
  types: ["land"],
  text: `{T}: Add {C}.\n${TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "permanent", filter: { isCommander: true } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
