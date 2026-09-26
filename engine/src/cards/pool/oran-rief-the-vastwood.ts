import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const COUNTERS_TEXT = "{T}: Put a +1/+1 counter on each green creature that entered this turn.";

// Every green creature that entered this turn, whoever controls it (the
// ruling), judged as the ability resolves: a creature turned green since it
// entered gets one.
export default defineCard({
  name: "Oran-Rief, the Vastwood",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {G}.\n${COUNTERS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", colors: ["G"], enteredThisTurn: true },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
