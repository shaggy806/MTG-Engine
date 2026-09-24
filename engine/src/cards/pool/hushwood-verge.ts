import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SECOND = "{T}: Add {W}. Activate only if you control a Forest or a Plains.";

// "a Forest or a Plains" is any permanent with either land type.
export default defineCard({
  name: "Hushwood Verge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {G}.\n${SECOND}`,
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      condition: {
        kind: "controls",
        filter: { subtypes: ["Forest", "Plains"] },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: SECOND,
    },
  ],
});
