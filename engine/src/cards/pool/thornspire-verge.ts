import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const GREEN = "{T}: Add {G}. Activate only if you control a Mountain or a Forest.";

// As Blazemire Verge: "a Mountain or a Forest" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Thornspire Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {R}.\n${GREEN}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Mountain", "Forest"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: GREEN,
    },
  ],
});
