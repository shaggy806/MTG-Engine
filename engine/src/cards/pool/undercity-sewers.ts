import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// A typed dual (Island Swamp — so it taps for both colours, and a Tainted
// land or a check land sees it as a Swamp) that enters tapped and surveils 1.
export default defineCard({
  name: "Undercity Sewers",
  colors: [],
  types: ["land"],
  subtypes: ["Island", "Swamp"],
  text:
    "({T}: Add {U} or {B}.)\n" +
    "This land enters tapped.\n" +
    "When this land enters, surveil 1.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When this land enters, surveil 1.",
    },
  ],
  activated: [manaTapAbility("U"), manaTapAbility("B")],
});
