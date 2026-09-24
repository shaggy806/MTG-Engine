import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SECOND = "{T}: Add {B}. Activate only if you control an Island or a Swamp.";

// "an Island or a Swamp" is any permanent with either land type.
export default defineCard({
  name: "Gloomlake Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {U}.\n${SECOND}`,
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: null, tap: true },
      condition: {
        kind: "controls",
        filter: { subtypes: ["Island", "Swamp"] },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: SECOND,
    },
  ],
});
