import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const COLOURED =
  "{T}, Pay 1 life: Add one mana of any color. Activate only if you control an artifact.";

// The coloured ability is still a mana ability (rule 605.1a — a life cost
// doesn't change that), so the auto-payer sees it: `manaSources` counts its
// `lifeCost`, and drops it while the artifact condition is false. The planner
// reaches for the painless {C} first wherever that will do.
export default defineCard({
  name: "Spire of Industry",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${COLOURED}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, payLife: 1 },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: COLOURED,
    },
  ],
});
