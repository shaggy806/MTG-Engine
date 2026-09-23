import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const UPKEEP =
  "At the beginning of your upkeep, if you control three or more artifacts, you gain 1 life.";
const SEARCH =
  "{4}, {T}, Sacrifice Inventors' Fair: Search your library for an artifact card, reveal it, put it into your hand, then shuffle. Activate only if you control three or more artifacts.";

// Both "three or more artifacts" clauses are metalcraft. The upkeep one is an
// intervening-if (rule 603.4 — checked as the upkeep begins and again on
// resolution, per the 2016-09-20 rulings); the activated one is rule 602.5,
// checked only as the ability is activated.
export default defineCard({
  name: "Inventors' Fair",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `${UPKEEP}\n{T}: Add {C}.\n${SEARCH}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "metalcraft" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: UPKEEP,
    },
  ],
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      condition: { kind: "metalcraft" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "artifact" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH,
    },
  ],
});
