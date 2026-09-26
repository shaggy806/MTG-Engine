import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SCRY_TEXT = "{2}{U}{U}, {T}: Scry 2.";

export default defineCard({
  name: "Castle Vantress",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control an Island.\n{T}: Add {U}.\n${SCRY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Island" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control an Island.",
    },
  ],
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{2}{U}{U}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});
