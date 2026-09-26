import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const BLUE = "{T}: Add {U}. Activate only if you control an Island or a Mountain.";

// As Blazemire Verge: "an Island or a Mountain" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Riverpyre Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {R}.\n${BLUE}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Island", "Mountain"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: BLUE,
    },
  ],
});
