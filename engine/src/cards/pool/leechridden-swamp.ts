import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

// EDHREC rank 2564.

const DRAIN_TEXT =
  "{B}, {T}: Each opponent loses 1 life. Activate only if you control two or more black permanents.";

export default defineCard({
  name: "Leechridden Swamp",
  colors: [],
  types: ["land"],
  subtypes: ["Swamp"],
  text: `({T}: Add {B}.)\nThis land enters tapped.\n${DRAIN_TEXT}`,
  static: [{ ...entersTappedStatic("Leechridden Swamp"), text: "This land enters tapped." }],
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{B}", tap: true },
      condition: { kind: "controls", filter: { colors: ["B"] }, atLeast: 2 },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
