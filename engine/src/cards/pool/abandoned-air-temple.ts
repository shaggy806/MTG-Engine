import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const TAPPED_TEXT = "This land enters tapped unless you control a basic land.";
const COUNTERS_TEXT = "{3}{W}, {T}: Put a +1/+1 counter on each creature you control.";

// Basic lands entering at the same time don't count (the ruling).
export default defineCard({
  name: "Abandoned Air Temple",
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {W}.\n${COUNTERS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { supertype: "basic", type: "land" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: "{3}{W}", tap: true },
      targets: [],
      effect: { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
