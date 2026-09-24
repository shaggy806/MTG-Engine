import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SECOND = "{T}: Add {U}. Activate only if you control a Plains or an Island.";

// "a Plains or an Island" is any permanent with either land type.
export default defineCard({
  name: "Floodfarm Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {W}.\n${SECOND}`,
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: null, tap: true },
      condition: {
        kind: "controls",
        filter: { subtypes: ["Plains", "Island"] },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: SECOND,
    },
  ],
});
