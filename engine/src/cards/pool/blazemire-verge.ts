import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const RED = "{T}: Add {R}. Activate only if you control a Swamp or a Mountain.";

// "a Swamp or a Mountain" is any permanent with either land type — a typed
// dual or a Triome counts, not only a basic. `subtypes` is an OR.
export default defineCard({
  name: "Blazemire Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {B}.\n${RED}`,
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: null, tap: true },
      condition: {
        kind: "controls",
        filter: { subtypes: ["Swamp", "Mountain"] },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: RED,
    },
  ],
});
