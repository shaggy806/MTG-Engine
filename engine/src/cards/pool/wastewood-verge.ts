import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const BLACK = "{T}: Add {B}. Activate only if you control a Swamp or a Forest.";

// As Blazemire Verge: "a Swamp or a Forest" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Wastewood Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {G}.\n${BLACK}`,
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Swamp", "Forest"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: BLACK,
    },
  ],
});
