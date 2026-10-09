import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 1207.
const DESTROY = "{T}, Sacrifice this land: Destroy target nonbasic land.";

export default defineCard({
  name: "Wasteland",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${DESTROY}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [{ kind: "permanent", filter: { type: "land", notSupertype: "basic" } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY,
    },
  ],
});
