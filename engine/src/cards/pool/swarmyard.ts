import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const REGEN_TEXT =
  "{T}: Regenerate target Insect, Rat, Spider, or Squirrel. (The next time it would be destroyed this turn, instead tap it, remove it from combat, and remove all damage from it.)";

export default defineCard({
  name: "Swarmyard",
  types: ["land"],
  text: `{T}: Add {C}.\n${REGEN_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { subtypes: ["Insect", "Rat", "Spider", "Squirrel"] } }],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
