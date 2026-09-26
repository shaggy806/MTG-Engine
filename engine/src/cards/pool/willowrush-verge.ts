import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const GREEN = "{T}: Add {G}. Activate only if you control a Forest or an Island.";

// As Blazemire Verge: "a Forest or an Island" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Willowrush Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {U}.\n${GREEN}`,
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Forest", "Island"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: GREEN,
    },
  ],
});
