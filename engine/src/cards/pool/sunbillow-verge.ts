import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const RED = "{T}: Add {R}. Activate only if you control a Mountain or a Plains.";

// As Blazemire Verge: "a Mountain or a Plains" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Sunbillow Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {W}.\n${RED}`,
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Mountain", "Plains"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: RED,
    },
  ],
});
