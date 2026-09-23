import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const SAC = "{T}, Sacrifice a creature: You gain 1 life.";

// The sacrifice is `{ filter }` rather than `"creature-you-control"`: the
// latter reads *printed* types, while "a creature" means what is a creature
// now (an animated man-land is one; `matchesFilter` folds the layers).
export default defineCard({
  name: "High Market",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${SAC}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "creature" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: SAC,
    },
  ],
});
