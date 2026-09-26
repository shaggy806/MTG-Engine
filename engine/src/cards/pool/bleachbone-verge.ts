import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const WHITE = "{T}: Add {W}. Activate only if you control a Plains or a Swamp.";

// As Blazemire Verge: "a Plains or a Swamp" is any permanent with either
// land type, a typed dual or a Triome as much as a basic.
export default defineCard({
  name: "Bleachbone Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {B}.\n${WHITE}`,
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtypes: ["Plains", "Swamp"] }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: WHITE,
    },
  ],
});
