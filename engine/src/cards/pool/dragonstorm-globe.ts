import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const COUNTER_TEXT = "Each Dragon you control enters with an additional +1/+1 counter on it.";

// A Dragon entering at the same time as the Globe doesn't get the counter
// (the ruling): `others-enter-battlefield` reaches only permanents entering
// while the Globe is already there.
export default defineCard({
  name: "Dragonstorm Globe",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${COUNTER_TEXT}\n{T}: Add one mana of any color.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { subtype: "Dragon", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: 1 },
      },
      text: COUNTER_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
