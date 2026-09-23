import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const DESTROY = "{T}, Sacrifice this land: Destroy target land.";

export default defineCard({
  name: "Strip Mine",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${DESTROY}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY,
    },
  ],
});
