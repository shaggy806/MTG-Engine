import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// A typed dual (Plains Swamp) that enters tapped and surveils 1.
export default defineCard({
  name: "Shadowy Backstreet",
  colors: [],
  types: ["land"],
  subtypes: ["Plains", "Swamp"],
  text:
    "({T}: Add {W} or {B}.)\n" +
    "This land enters tapped.\n" +
    "When this land enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
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
  activated: [manaTapAbility("W"), manaTapAbility("B")],
});
