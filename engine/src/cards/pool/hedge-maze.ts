import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// A typed dual (Forest Island — so it taps for both colours and a check land
// or a Verge sees both types) that enters tapped and surveils 1.
export default defineCard({
  name: "Hedge Maze",
  colors: [],
  types: ["land"],
  subtypes: ["Forest", "Island"],
  text:
    "({T}: Add {G} or {U}.)\n" +
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
  activated: [manaTapAbility("G"), manaTapAbility("U")],
});
